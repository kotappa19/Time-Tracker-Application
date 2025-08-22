# Deployment Guide

## Vercel Deployment

### Environment Variables Required

Make sure to set the following environment variables in your Vercel project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Steps to Deploy

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel project settings
3. Deploy the project
4. The build should now complete successfully

### Troubleshooting

If you encounter build issues:

1. Check that all Firebase environment variables are set correctly
2. Ensure your Firebase project is properly configured
3. Check the build logs for any specific error messages

### Local Development

To run locally:

```bash
npm install
npm run dev
```

Make sure to create a `.env.local` file with the same environment variables for local development.
