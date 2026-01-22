This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment configuration (required)

This frontend talks to the backend API over HTTP(S). Configure the backend base URL via **NEXT_PUBLIC_** variables.

### Backend API base URL

Set one of the following:

- **`NEXT_PUBLIC_API_BASE_URL`** (preferred)
- `NEXT_PUBLIC_API_BASE` (legacy)
- `NEXT_PUBLIC_BACKEND_URL` (legacy)

If none are set, the frontend defaults to:

- `http://localhost:3001`

Example:

```bash
# Local dev
export NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
export NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000" # optional (display-only)
```

### OAuth callback URLs (display-only)

The Settings → “Git Provider Connections” UI surfaces the callback URLs you’ll need when configuring OAuth apps:

- Frontend callback (recommended UX): `http://localhost:3000/auth/<provider>/callback`
- Backend callback (backend-only flow): `http://localhost:3001/auth/<provider>/callback`

These are **display-only** hints; the actual auth flow uses `window.location.origin` for return routing.

### CORS note

Backend CORS must allow the frontend origin (default `http://localhost:3000`). The backend container is already configured to allow this origin and supports environment-based overrides; do not loosen CORS beyond required.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
