# byte & dune

A static cybersecurity blog built with [Hugo](https://gohugo.io/), searched with
[Pagefind](https://pagefind.app/), and served from a home lab behind
[Pangolin](https://github.com/fosrl/pangolin) via a Caddy container.

Content is Markdown + YAML front matter. No database, no CMS, no server-side
runtime — just files, a build step, and a static server.

---

## Requirements

- **Hugo extended** ≥ 0.128 (`brew install hugo`) — the *extended* build is
  required for asset processing/minification.
- **Node** (only for Pagefind, which is run via `npx`; nothing is installed
  globally).
- **Docker** + Docker Compose for the production container.

## Local development

```bash
make dev        # hugo server -D  → http://localhost:1313  (includes drafts)
```

Live reload is on. Draft posts (`draft: true` in front matter) show up in
`hugo server` but are excluded from production builds.

## Writing a new post

```bash
hugo new content/<section>/<slug>.md
```

`<section>` is one of `security`, `ctfs`, `homelab`, `misc`. The archetype in
[`archetypes/default.md`](archetypes/default.md) pre-fills the front matter:

```yaml
---
title: "HTB Sherlock: tracing a C2 beacon through DNS logs"
date: 2026-07-01
tags: ["forensics", "htb"]
section: ctfs          # inferred from the folder; kept explicit for clarity
description: "Short summary used for search and SEO."
draft: true            # flip to false (or delete) to publish
---
```

- The post's **section is its folder** — dropping the file in `content/ctfs/`
  gives it the CTF theme automatically.
- `tags` power both the `/tags/<tag>/` taxonomy pages and the CTF section's
  client-side tag filter.
- `description` is used in the listing cards, the homepage feed, and search.

New posts appear automatically in:
1. their section listing page,
2. the **"Latest across the blog"** feed on the homepage (all sections, newest
   first), and
3. the Pagefind search index (rebuilt on every production build).

## Building for production

```bash
make build      # hugo --minify  +  npx pagefind --site public
```

Output lands in `public/`. The `pagefind/` search index is written there too.
`public/` is git-ignored — it's a build artifact.

## Deploying (Docker + Caddy)

```bash
make docker     # docker compose up -d --build
```

The multi-stage [`Dockerfile`](Dockerfile) builds the Hugo site and Pagefind
index, then copies `public/` into a Caddy image.
[`docker-compose.yml`](docker-compose.yml) publishes the container on host port
`8080` — point Pangolin (or any reverse proxy) at that.

TLS is terminated at the edge by Pangolin, so Caddy serves plain HTTP on `:80`
inside the container (see [`Caddyfile`](Caddyfile)). If you ever expose the
container directly to the internet instead, change `:80` to your domain in the
Caddyfile and map ports `80:80`/`443:443` in compose — Caddy will then obtain a
Let's Encrypt certificate automatically.

> **CI/CD:** intentionally not set up yet. When you want it, a workflow just
> needs to run `hugo --minify`, then `npx pagefind --site public`, then ship
> `public/` to the box (rsync over SSH) or rebuild the container there.

## Adjusting section theme colours (one place)

All theming lives in [`assets/css/main.css`](assets/css/main.css). Each section
sets a handful of CSS custom properties on its `body.theme-*` class — **edit
only that block to retheme a section:**

```css
body.theme-security {
  --section-bg: #0d1b2a;      /* background            */
  --section-text: #e6eef5;    /* body text             */
  --section-muted: #8aa0b3;   /* secondary text        */
  --section-accent: #5de89a;  /* links, labels, accents */
  --section-border: rgba(93, 232, 154, 0.22);
}
```

The two signature anchors — **Prussian blue** (`--prussian`) and **burnt
orange** (`--burnt`) — are defined once in `:root` and reused across every
section.

The mapping from a page to its theme is
[`layouts/partials/theme-key.html`](layouts/partials/theme-key.html): it returns
the section name (or `home` for the homepage and About page), which becomes the
`body.theme-*` class. Section metadata (display label, eyebrow text, whether the
section is tag-filterable) lives in each section's `_index.md` front matter.

## Project layout

```
content/            Markdown posts + section _index.md files
layouts/
  _default/         baseof, list, single, about, term, 404
  partials/         head, header (nav), footer, search, icon, theme-key, section-label
  index.html        homepage (hero + combined feed)
assets/
  css/main.css      the whole design system
  js/site.js        nav, search modal, tag filter, hero constellation
static/             favicon, pgp.asc  (replace pgp.asc with your real key)
Dockerfile          multi-stage: Hugo build → Pagefind → Caddy
docker-compose.yml  serves the container on :8080
Caddyfile           static file server, cache + security headers
```

## Notes

- Search opens from the nav's magnifier icon (or press `/`). Pagefind only runs
  in production builds, so the modal is empty under `hugo server` — run
  `make build && cd public && python3 -m http.server` to test search locally.
- Replace [`static/pgp.asc`](static/pgp.asc) with your real public key:
  `gpg --armor --export you@example.com > static/pgp.asc`.
