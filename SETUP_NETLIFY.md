# Netlify Deployment Setup

## Step 1 — Get your Firebase Service Account key

1. Go to https://console.firebase.google.com → your project
2. Project Settings → Service Accounts
3. Click "Generate new private key" → download the JSON file
4. Open the JSON file in a text editor and copy ALL the content

## Step 2 — Add Environment Variable in Netlify

1. Go to your Netlify site dashboard
2. Site Settings → Environment Variables → Add variable
3. Key:   FIREBASE_SERVICE_ACCOUNT
4. Value: paste the entire JSON content (single line is fine)
5. Save

## Step 3 — Upload Firebase Security Rules

1. Go to https://console.firebase.google.com → your project
2. Realtime Database → Rules tab
3. Replace the existing rules with the content of database.rules.json
4. Click Publish

## Step 4 — Deploy to Netlify

Push to your Git repository as normal.
Netlify will automatically install firebase-admin from package.json
and deploy the function in netlify/functions/s245645645.js

## What each piece does

| File                              | Purpose                                        |
|-----------------------------------|------------------------------------------------|
| netlify/functions/s245645645.js   | All scoring / write logic — runs on server     |
| database.rules.json               | Blocks all direct browser writes to Firebase  |
| package.json                      | Declares firebase-admin dependency             |
| netlify.toml                      | Points Netlify to the functions folder         |
| .gitignore                        | Prevents service account key from being saved  |

## Security summary

- Public viewers (display screen, mobile) → read-only Firebase access
- All score writes → go through the Netlify Function using Admin SDK
- Service account key → only in Netlify env vars, never in any file
- Admin panel URL → obfuscated (security through obscurity)
- Timer countdown → direct write allowed (not score-critical data)
