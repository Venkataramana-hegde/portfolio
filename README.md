# Venkataramana Hegde · Portfolio

Personal portfolio site. pnpm, Next.js 16, React 19, Tailwind CSS v4, TypeScript. Statically rendered.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start   # production build with security headers
pnpm lint
```

## Edit content

All copy lives in [`src/content/profile.ts`](src/content/profile.ts). The résumé PDF lives at `public/venkataramana-hegde-resume.pdf`.

## Deploy

Deploy to Vercel (or any Node host). Set `NEXT_PUBLIC_SITE_URL` to the production origin, for example `https://venkataramanahegde.dev`, so canonical URLs, the sitemap and social previews use the real domain.
