# AfyaSmart

Expo app backed by Firebase Authentication, Cloud Firestore, and Firebase Cloud
Functions.

## Firebase setup

Create a Firebase project, enable Email/Password and Google sign-in, and create
a Firestore database. Then add these values to your Expo environment:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
EXPO_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-afya-smart-377ad.cloudfunctions.net
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
```

You can also place the same values in `app.json` under
`expo.extra.firebase`.

For Google sign-in, enable `Authentication > Sign-in method > Google` in the
Firebase Console. Then add OAuth client IDs from Google Cloud Console. During
development, the web client ID is usually enough for Expo Go; native builds
should use Android/iOS client IDs with the app package/bundle identifiers.

## Firestore collections

- `users/{uid}` stores auth profile, subscription fields, and `chat_count`.
- `users/{uid}/chatMessages/{messageId}` stores app-friendly chat messages.
- `users/{uid}/chatLogs/{logId}` stores Laravel-style chat request/reply logs
  written by Cloud Functions.
- `doctors/{doctorId}` stores doctor directory records.
- `drugs/{drugId}` stores local medicine records.
- `pharmacies/{pharmacyId}` stores pharmacy directory records.
- `paymentRequests/{checkoutRequestId}` stores M-Pesa payment requests created
  and updated by Cloud Functions.

## Subscription model

The app treats a user as subscribed only when:

- `users/{uid}.is_subscribed` is `true`
- `users/{uid}.subscription_expires_at` is empty or in the future

Free users can sign in, finish onboarding, open Home/Profile/Chat, and use the
free chat allowance. Premium routes such as symptoms, drugs, doctors,
pharmacies, diagnosis results, and nearby services redirect to the subscription
screen until the user pays.

Successful M-Pesa confirmation updates the Firebase user document:

```json
{
  "is_subscribed": true,
  "subscription_plan": "daily | weekly | monthly",
  "chat_count": 0,
  "subscription_expires_at": "ISO date string"
}
```

## Seed Firestore

The old Laravel seeders can be exported to JSON and imported into Firestore.

Export from the Laravel API repo:

```bash
php scripts/export-laravel-seeders.php D:\Project\AfyaSmart-API
```

This writes:

- `seed-data/doctors.json`
- `seed-data/drugs.json`
- `seed-data/pharmacies.json`

To import into Firestore, create a Firebase service account key from:

```text
Firebase Console > Project settings > Service accounts > Generate new private key
```

Then run:

```bash
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
cd functions
npm run seed
cd ..
```

In PowerShell, use:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
cd functions
npm run seed
cd ..
```

The importer writes to `doctors`, `drugs`, and `pharmacies` using stable document
IDs based on email, phone, or name, so rerunning it updates existing seed data.

## Cloud Functions

The Firebase Functions in `functions/index.js` mimic the old Laravel API:

- `chatSend`, `chatStatus`, `chatHistory`
- `mpesaInitiate`, `mpesaStatus`, `mpesaCallback`

Install function dependencies:

```bash
cd functions
npm install
cd ..
```

Set M-Pesa secrets before deploying:

```bash
firebase functions:secrets:set MPESA_CONSUMER_KEY
firebase functions:secrets:set MPESA_CONSUMER_SECRET
firebase functions:secrets:set MPESA_PASSKEY
firebase functions:secrets:set MPESA_SHORTCODE
firebase functions:secrets:set MPESA_CALLBACK_URL
firebase functions:secrets:set MPESA_ENV
```

Use `sandbox` or `production` for `MPESA_ENV`. Set `MPESA_CALLBACK_URL` to:

```text
https://us-central1-afya-smart-377ad.cloudfunctions.net/mpesaCallback
```

Deploy:

```bash
firebase deploy --only firestore:rules,functions
```

M-Pesa Cloud Functions generally require the Firebase Blaze plan because they
make outbound requests to Safaricom Daraja.

## Run

```bash
npm install
npx expo start
```
