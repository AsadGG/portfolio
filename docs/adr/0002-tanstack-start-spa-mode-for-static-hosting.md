# TanStack Start runs in SPA mode so the site can be hosted on GitHub Pages

The site is hosted from the `AsadGG/portfolio` repository as a GitHub Pages project site at `/portfolio/`. GitHub Pages serves static files, so we keep the TanStack Start scaffold and run it in SPA mode. The Pages build uses `/portfolio/` as the Vite base path, and the router and content loader use that base path for client navigation and JSON requests. The build copies the SPA shell to `index.html` and `404.html` so Pages can serve the client app on direct requests. The root route's meta and OG tags are baked into the shell. All other rendering happens on the client.

## Considered Options

- **Prerender every route.** Rejected: content is fetched at runtime via ky (ADR 0001), so prerendering would require build-time fetching against an absolute URL. The extra complexity isn't worth it for a single-page site.
- **Drop Start for plain Vite + TanStack Router.** Rejected: Start is already scaffolded, and keeping it leaves server functions and SSR available if hosting later moves off GitHub Pages.
