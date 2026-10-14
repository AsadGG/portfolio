# Portfolio content is fetched as static JSON through ky into TanStack DB

Portfolio content lives in per-entity JSON files (such as `profile.json`, `skills.json`, `engagements.json`, `projects.json`) served as static assets. Each file is wrapped in the same response envelope the future API will return (`statusCode`, `message`, `data`, plus `pagination` for lists). At runtime ky fetches them over HTTP and loads each one into its own TanStack DB query collection. Components read the data with live queries. Importing the JSON directly would be simpler today, but the files are meant to stand in for a future API. The planned migration is to point ky's base URL at a real server, with no changes to components or collections.

## Consequences

- Content is not in the JS bundle. The page needs a network round-trip before content renders, so it needs loading states.
- Relationships (Engagement → Project, Project → Skill) are references by id across files and are joined in live queries, not nested. Each file is validated with zod when it is fetched.
