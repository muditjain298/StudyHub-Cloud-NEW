# StudyHub Premium setup

Create these Appwrite resources in the existing database. Enable **document security** on every collection and keep the premium bucket private.

Set `ADMIN_EMAIL=muditjain298@gmail.com` in every Appwrite Function and `VITE_ADMIN_EMAIL=muditjain298@gmail.com` in the frontend environment. The email allowlist is authoritative: all other Appwrite accounts are users, even if a profile document incorrectly contains `role: "admin"`.

## Collections

| Collection | Attributes | Document permissions |
| --- | --- | --- |
| `profiles` | `name` string, `email` email, `isPremium` boolean, `role` string, `grantedBy` string optional, `grantedAt` datetime optional | User read/update own profile only. Admin grants use the `admin-premium` Function with an API key. |
| `premiumContent` | `title` string, `type` enum (`note`, `video`, `questionbank`, `ppt`, `report`), `fileId` string optional, `videoUrl` URL optional, `uploadedBy` string, `createdAt` datetime | Premium users read. Admin Function/API key creates, updates, and deletes. No client write permission. |
| `premiumStars` | `userId` string, `contentId` string, `createdAt` datetime | The owning user can read/create/delete documents. Use document ID `{userId}_{contentId}`. |
| `payments` | `userId` string, `razorpayPaymentId` string, `razorpayOrderId` string, `amount` integer, `status` string, `timestamp` datetime | API key/Functions only. No client read or write. |

The content collection must be readable by authenticated users only at the Appwrite collection level; the UI route additionally hides it from non-premium users, and the secure-file Function performs the authoritative `isPremium` check. Do not add a public read permission.

## Functions

Deploy the folders under `backend/functions` as Node.js Appwrite Functions. Each function needs `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_PROFILE_COLLECTION_ID`, `APPWRITE_PREMIUM_CONTENT_COLLECTION_ID`, `APPWRITE_PAYMENTS_COLLECTION_ID`, `APPWRITE_PREMIUM_BUCKET_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `PREMIUM_PRICE_PAISE`.

Set the function execute permission to authenticated users for `create-order`, `verify-payment`, `secure-premium-file`, and `admin-premium`; the latter must also verify the caller's admin profile before mutation. Set `payment-webhook` to its HTTP endpoint only and configure that endpoint in Razorpay for `payment.captured` and `payment.failed`.

The Razorpay signature is checked using HMAC-SHA256 for both checkout verification (`order_id|payment_id`) and the raw webhook body (`X-Razorpay-Signature`). Webhook handling is idempotent in production: add a unique index on `razorpayPaymentId` and treat duplicate captured events as already processed.

## Secure access notes

The browser never receives a stored Appwrite file URL. `secure-premium-file` checks the caller's profile and should proxy the private object or return a URL with a maximum five-minute expiry. The viewer disables common right-click/save shortcuts to deter casual downloading, but browser-rendered content cannot be made leak-proof. Video content stays external (unlisted YouTube/Vimeo); store only the embed URL and return it only to a verified premium session.