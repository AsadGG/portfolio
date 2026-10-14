# TanStack Start runs in SPA mode so the site can be hosted statically

The site will be hosted on GitHub Pages (`<username>.github.io`, served at `/`), which serves only static files. We keep the TanStack Start scaffold and run it in SPA mode. The build produces a static HTML shell, and the root route's meta and OG tags are baked into that shell. All other rendering happens on the client.

## Considered Options

- **Prerender every route.** Rejected: content is fetched at runtime via ky (ADR 0001), so prerendering would require build-time fetching against an absolute URL. The extra complexity isn't worth it for a single-page site.
- **Drop Start for plain Vite + TanStack Router.** Rejected: Start is already scaffolded, and keeping it leaves server functions and SSR available if hosting later moves off GitHub Pages.
