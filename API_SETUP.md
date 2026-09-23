# Tripora API configuration

## Important
The frontend must NOT default to `localhost:5001` when deployed. `localhost` means the visitor's own computer and causes a browser `Network Error` if the backend is not running there.

For local testing against Sameer's development backend, create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

For the currently known deployed Tripora backend, the frontend default is:

```text
https://trip-maker-backend.vercel.app/api/v1
```

If Sameer has deployed the NEW backend to a different URL, set that exact URL in `.env.local` locally or in Vercel Environment Variables as `VITE_API_BASE_URL`, then redeploy.

Vite environment variables are injected at build time, so changing them requires restarting the dev server or redeploying the frontend.
