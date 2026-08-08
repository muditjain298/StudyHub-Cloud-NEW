const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// In-memory OTP store (for local dev; use Redis in production)
const otpStore = {};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// ─────────────────────────────────────────────
// @desc    Register new user (email/password)
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, authProvider: 'local' });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Login user (email/password)
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log("email:", email);
    console.log("user Found:", user);
    if(user){
      console.log("Password Match:", await user.matchPassword(password));
    }
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        college: user.college,
        semester: user.semester,
        branch: user.branch,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get profile
// @route   GET /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
// ─────────────────────────────────────────────
const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  try {
    const otp = otpGenerator.generate(6, {
      digits: true, upperCaseAlphabets: false,
      lowerCaseAlphabets: false, specialChars: false,
    });

    // Store OTP with 5-min expiry
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // In production, use Twilio/MSG91. For dev, we log the OTP.
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({ message: `OTP sent successfully to ${phone}. Check server logs for development OTP.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Verify OTP & login/register user
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

  try {
    const record = otpStore[phone];
    if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (Date.now() > record.expires) {
      delete otpStore[phone];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // OTP is valid – clear it
    delete otpStore[phone];

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        name: name || `User${phone.slice(-4)}`,
        phone,
        authProvider: 'phone',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Forgot Password – send reset email
// @route   POST /api/auth/forgotpassword
// @access  Public
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

       resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"StudyHub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'StudyHub Password Reset',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#4f46e5">Reset your StudyHub password</h2>
          <p>You requested a password reset. Click the button below to set a new password. This link expires in <b>10 minutes</b>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a>
          <p style="color:#888;margin-top:24px;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent successfully!' });
  } catch (error) {
    // If mail fails, clear the token so user can try again
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    res.status(500).json({ message: 'Email could not be sent. Check your email credentials in .env.' });
  }
};

// ─────────────────────────────────────────────
// @desc    Reset Password using token
// @route   POST /api/auth/resetpassword/:token
// @access  Public
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
