import { useState } from 'react';
import axios from 'axios';
import { X, Link2, Lock, Clock, Eye, EyeOff, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ShareModal({ shareType, section, folderId, fileId, onClose, token: userToken }) {
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
        'api/shares',
        {
          shareType,
          section: section || '',
          folderId: folderId || null,
          fileId: fileId || null,
          password: usePassword && password ? password : null,
          expiresInHours: expiresInHours || null,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setGeneratedLink(res.data.shareUrl);
      toast.success('Share link generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

 const handleCopy = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(generatedLink);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    toast.error("Copy failed");
    console.error(err);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
              <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Share</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{shareType}: {section || folderId || fileId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Password Protection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Protection</span>
              </div>
              <button
                onClick={() => setUsePassword(!usePassword)}
                className={`w-11 h-6 rounded-full transition-colors relative ${usePassword ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${usePassword ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            {usePassword && (
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Expiry */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Link Expiry</span>
            </div>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Never Expires</option>
              <option value="1">1 Hour</option>
              <option value="24">1 Day</option>
              <option value="72">3 Days</option>
              <option value="168">1 Week</option>
            </select>
          </div>

          {/* Generated Link */}
          {generatedLink && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">Share Link</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-700 dark:text-gray-300 break-all flex-1">{generatedLink}</code>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {generatedLink ? 'Regenerate Link' : 'Generate Share Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
