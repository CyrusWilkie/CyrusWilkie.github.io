# Frictionless publishing: Notion → n8n → GitHub

Write a post in Notion, flip a status toggle, and n8n proofreads it with your
local Ollama model (qwen3.6) and commits the Markdown to this repo — where the
existing GitHub Actions workflow builds and deploys it. No terminal, no git, no
local Hugo, and the proofreading runs entirely on your own hardware.

```
Notion "Blog" DB ──(status = Ready)──▶ n8n
                                        │  1. fetch page blocks
                                        │  2. blocks → Markdown
                                        │  3. Ollama (qwen3.6) proofreads the prose
                                        │  4. build front matter from properties
                                        │  5. commit to content/<section>/<slug>.md
                                        ▼
                              GitHub (master) ──▶ deploy.yml ──▶ live site
```

The proofreader **only sees the post body**, never the front matter — the
workflow assembles the YAML from your Notion fields *after* proofreading, so the
AI can't touch your metadata and its instructions stay focused on prose (it
leaves code blocks, commands, and flags alone).

Two publish modes are built in; pick per your comfort level (details in
[§5](#5-commit-to-github-two-modes)):

- **Auto** — commit straight to `master`; the deploy runs immediately. Most
  frictionless; the original is always in git history to diff/revert.
- **PR** — open a Pull Request with the proofread post; you glance at the diff
  and click merge to publish. One extra tap, full control.

---

## 1. Notion database

Create a database called **Blog** with these properties (exact names matter —
the workflow reads them):

| Property | Type | Purpose |
|---|---|---|
| `Title` | Title | Post title → front-matter `title` |
| `Section` | Select | `Security` / `CTFs` / `Home lab` / `Misc` — picks the folder |
| `Tags` | Multi-select | → front-matter `tags` (also feeds the CTF tag filter) |
| `Description` | Text | One-line summary → front-matter `description` |
| `Slug` | Text | Optional. Filename; if blank, derived from the title |
| `Status` | Select | `Draft` / `Ready to publish` / `Published` |
| `Publish date` | Date | Optional. → front-matter `date`; defaults to now |

The **page body** is the post. Write it with Notion's normal editor — headings,
bold/italic, links, bulleted and numbered lists, quotes, and code blocks all
convert. Set **Status → Ready to publish** when you want it to go live.

The `Section` values map to folders like this (handled in the code node):

| Section select | Folder |
|---|---|
| Security | `content/security/` |
| CTFs | `content/ctfs/` |
| Home lab | `content/homelab/` |
| Misc | `content/misc/` |

---

## 2. Credentials to create in n8n

1. **Notion** — a Notion internal integration token (Notion → Settings →
   Connections → your integration), shared with the Blog database. Add it as an
   n8n *Notion API* credential **and** note the raw token for the HTTP node.
2. **Ollama** — no key needed; just a reachable endpoint. Default is
   `http://localhost:11434`. **Networking caveat:** if n8n runs in Docker,
   `localhost` points at the *container*, not the host running Ollama — use
   `http://host.docker.internal:11434` (Docker Desktop) or the host's LAN IP
   (Linux), and start Ollama with `OLLAMA_HOST=0.0.0.0` so it accepts
   connections from the n8n container. Confirm the model tag with `ollama list`
   (it may be `qwen3` or similar rather than exactly `qwen3.6`).
3. **GitHub** — a fine-grained PAT with **Contents: Read and write** (and
   **Pull requests: Read and write** if you use PR mode) on
   `cyruswilkie/cyruswilkie.github.io`.

Set Notion and GitHub as n8n credentials so the HTTP nodes reference them via
the credential selector rather than hard-coding secrets. Ollama needs no
credential — the proofread node just points at its URL.

---

## 3. The workflow, node by node

An importable scaffold is in
[`karo0-publish.workflow.json`](karo0-publish.workflow.json) — import it, then
attach your three credentials and fill in the two placeholders
(`YOUR_NOTION_DB_ID`, and confirm the repo owner/name). Node typeVersions may
need bumping to match your n8n; the logic is what matters. Walkthrough:

### Node 1 — Schedule Trigger

Runs every 5 minutes (tune to taste). Cheap: it only queries Notion for pages
whose status is `Ready to publish`.

### Node 2 — Notion: Get Database Pages (filtered)

Notion node → **Database Page: Get Many**, database = **Blog**, filter
**Status = Ready to publish**. Emits one item per ready post.

### Node 3 — HTTP: fetch the page's blocks

The Notion node doesn't return Markdown, so pull the raw blocks and convert them
ourselves (no external npm modules needed).

- Method: `GET`
- URL: `https://api.notion.com/v1/blocks/{{ $json.id }}/children?page_size=100`
- Auth: your Notion credential (or header `Authorization: Bearer <token>`)
- Header: `Notion-Version: 2022-06-28`

> Nested blocks (toggles, list items with children) aren't recursed by this
> single call. For flat blog posts that's fine; if you nest heavily, see the
> note at the end of the converter.

### Node 4 — Code: Notion blocks → Markdown

A **Code** node (JavaScript, "Run Once for Each Item") that walks the blocks.
Paste [§4a](#4a-blocks--markdown-code) below. It outputs `{ markdown }` plus the
Notion properties passed through.

### Node 5 — HTTP: Ollama proofread

Calls your local Ollama chat API. Body and system prompt in
[§4b](#4b-ollama-proofread-request). The proofreader receives **only the body
Markdown** and returns a corrected version — same structure, code untouched.

### Node 6 — Code: assemble the file

Prepends YAML front matter (built from the Notion properties) to the proofread
body, and computes the slug, section folder, date, and commit path. See
[§4c](#4c-assemble-front-matter--path).

### Node 7 — IF: which publish mode?

A **Set** node sets `mode` to `"auto"` or `"pr"`; an **IF** node branches on it.
Flip the Set node to switch modes. Both branches are in
[§5](#5-commit-to-github-two-modes).

### Node 8 — Notion: mark Published

After a successful commit, update the page's **Status → Published** so it isn't
picked up again. (In PR mode you may prefer a `Pending review` status until the
PR merges — your choice.)

---

## 4. The code and request bodies

### 4a. Blocks → Markdown (Code node)

```javascript
// n8n Code node — "Run Once for Each Item"
// Input: the Notion "get block children" response on $json.results
// Output: { markdown, props } where props carries the page for later nodes.

const blocks = $json.results || [];

// Inline rich-text → Markdown, preserving bold/italic/code/strike/links.
function rt(arr = []) {
  return arr.map((t) => {
    let s = t.plain_text ?? t.text?.content ?? "";
    const a = t.annotations || {};
    if (a.code) s = "`" + s + "`";
    if (a.bold) s = "**" + s + "**";
    if (a.italic) s = "*" + s + "*";
    if (a.strikethrough) s = "~~" + s + "~~";
    const href = t.href || t.text?.link?.url;
    if (href) s = "[" + s + "](" + href + ")";
    return s;
  }).join("");
}

const lines = [];
for (const b of blocks) {
  const t = b.type;
  const d = b[t] || {};
  switch (t) {
    case "heading_1": lines.push("# " + rt(d.rich_text), ""); break;
    case "heading_2": lines.push("## " + rt(d.rich_text), ""); break;
    case "heading_3": lines.push("### " + rt(d.rich_text), ""); break;
    case "paragraph": lines.push(rt(d.rich_text), ""); break;
    case "bulleted_list_item": lines.push("- " + rt(d.rich_text)); break;
    case "numbered_list_item": lines.push("1. " + rt(d.rich_text)); break;
    case "to_do":
      lines.push("- [" + (d.checked ? "x" : " ") + "] " + rt(d.rich_text)); break;
    case "quote": lines.push("> " + rt(d.rich_text), ""); break;
    case "code":
      lines.push("```" + (d.language || ""), rt(d.rich_text), "```", ""); break;
    case "divider": lines.push("---", ""); break;
    default:
      if (d.rich_text) lines.push(rt(d.rich_text), ""); // fallback
  }
}

// Collapse consecutive blank lines from list runs.
const markdown = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

return { markdown, props: $json.__props || {} };
```

> To pass the Notion page properties into this node, use a **Set** node before
> Node 3 that stashes them (e.g. `__props` = the whole Notion page), or read
> them again in Node 6 from the earlier Notion item via
> `$('Notion: Get Database Pages').item.json`. The scaffold wires the latter.

> **Nested blocks:** if a block has `has_children: true` and you use toggles or
> nested lists, add a recursive fetch (another HTTP call per parent block id).
> Flat posts don't need it.

### 4b. Ollama proofread request

**HTTP Request node** → `POST http://localhost:11434/api/chat`
(swap the host per the networking caveat in [§2](#2-credentials-to-create-in-n8n)
if n8n is containerized).

Headers:

```
content-type: application/json
```

Body (JSON):

```json
{
  "model": "qwen3.6",
  "stream": false,
  "think": false,
  "options": { "temperature": 0.2 },
  "messages": [
    { "role": "system", "content": "You are a copy editor for a technical cybersecurity blog. Correct only spelling, grammar, and punctuation errors in the Markdown the user sends. Rules: (1) Preserve the Markdown structure exactly — headings, lists, blockquotes, links, emphasis. (2) NEVER change anything inside fenced code blocks or inline code spans — no edits to commands, flags, code, hostnames, hex, or payloads, even if they look misspelled. (3) Keep technical terms, product names, and CTF flag formats as written. (4) Do not rewrite, reword, restructure, add, or remove content — fix mistakes only. (5) Return ONLY the corrected Markdown, with no preamble, no explanation, no <think> reasoning, and no code fence around the whole document.",
    { "role": "user", "content": "={{ $json.markdown }}" }
  ]
}
```

- `={{ $json.markdown }}` is an n8n expression injecting the body from Node 4.
- **Model:** set `"model"` to the exact tag from `ollama list` (`qwen3.6`,
  `qwen3`, etc.).
- `"stream": false` returns the whole reply in one response object.
- `"think": false` disables qwen3's chain-of-thought (supported on recent
  Ollama). Older builds ignore it and may still wrap reasoning in
  `<think>…</think>` — the assemble node strips those defensively either way.
- `"temperature": 0.2` keeps the edit conservative and close to deterministic.

**Read the reply** in the next node as `{{ $json.message.content }}`. If it comes
back empty, the assemble node falls back to the un-proofread body rather than
publishing an empty file.

### 4c. Assemble front matter + path (Code node)

```javascript
// n8n Code node — builds the final file and the GitHub path.
// Reads the proofread text from the Ollama node and the Notion properties.

const resp = $json;                   // Ollama /api/chat response on this item
let proofed = (resp.message && resp.message.content) || "";
proofed = proofed.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();  // strip qwen3 reasoning
if (!proofed) proofed = $('Blocks to Markdown').item.json.markdown;  // fallback: original body
proofed = proofed.trimEnd() + "\n";

// Pull Notion properties from the earlier Notion node.
const page = $('Notion: Get Database Pages').item.json;
const P = page.properties;

const title = P.Title.title.map((t) => t.plain_text).join("");
const sectionLabel = P.Section.select?.name || "Misc";
const tags = (P.Tags.multi_select || []).map((t) => t.name);
const description = (P.Description.rich_text || []).map((t) => t.plain_text).join("");
const slugProp = (P.Slug?.rich_text || []).map((t) => t.plain_text).join("").trim();
const date = P["Publish date"]?.date?.start || new Date().toISOString().slice(0, 10);

// Section label → content folder.
const folderMap = {
  "Security": "security",
  "CTFs": "ctfs",
  "Home lab": "homelab",
  "Misc": "misc",
};
const section = folderMap[sectionLabel] || "misc";

// Slug: from the Slug property, else a kebab-case of the title.
const slug = (slugProp || title)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

// YAML front matter (quote strings; join tags as a JSON array).
const fm = [
  "---",
  `title: ${JSON.stringify(title)}`,
  `date: ${date}`,
  `tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
  `section: ${section}`,
  `description: ${JSON.stringify(description)}`,
  "---",
  "",
].join("\n");

const fileContent = fm + proofed;
const path = `content/${section}/${slug}.md`;

return {
  path,
  slug,
  section,
  branch: `post-${slug}`,
  commitMessage: `Add post: ${title}`,
  // GitHub Contents API wants base64:
  contentBase64: Buffer.from(fileContent, "utf8").toString("base64"),
  pageId: page.id,
};
```

---

## 5. Commit to GitHub (two modes)

Set `owner = cyruswilkie`, `repo = cyruswilkie.github.io` in these calls.

### Mode: Auto (commit to master)

One HTTP Request node:

- `PUT https://api.github.com/repos/cyruswilkie/cyruswilkie.github.io/contents/{{ $json.path }}`
- Headers: `Authorization: Bearer <PAT>`, `Accept: application/vnd.github+json`
- Body:

```json
{
  "message": "={{ $json.commitMessage }}",
  "content": "={{ $json.contentBase64 }}",
  "branch": "master"
}
```

This lands on `master` → the deploy workflow fires → live in a couple of
minutes.

> **Updating an existing post** (same path) requires the file's current `sha`:
> add a `GET .../contents/{{ $json.path }}?ref=master` before the PUT and pass
> its `sha` in the body. For brand-new posts, omit `sha`.

### Mode: PR (review before publish)

Four HTTP Request nodes in series:

1. **Get master's head SHA**
   `GET .../git/ref/heads/master` → read `{{ $json.object.sha }}`
2. **Create a branch**
   `POST .../git/refs` with
   `{ "ref": "refs/heads/{{ $json.branch }}", "sha": "<head sha>" }`
3. **Commit the file to that branch** — same `PUT .../contents/{{ $json.path }}`
   as Auto, but with `"branch": "{{ $json.branch }}"`.
4. **Open the PR**
   `POST .../pulls` with
   `{ "title": "={{ $json.commitMessage }}", "head": "={{ $json.branch }}", "base": "master", "body": "Proofread by qwen3.6, ready for review." }`

Merging the PR pushes to `master` → deploy runs. Nothing goes live until you
merge.

---

## 6. Trying both modes

The scaffold has a **Set** node named *Publish mode* with a single field
`mode`. Set it to `"auto"` or `"pr"` and the IF node routes accordingly. Run a
test post through each:

- **Auto** feels like magic — flip Notion to *Ready*, wait ~5 min, refresh the
  site. Best once you trust the proofreader.
- **PR** gives you a diff to eyeball in GitHub. Good while you're calibrating,
  or for posts you want a second look at.

You can even key the mode off Notion — e.g. a `Review first` checkbox on the
page that the workflow reads into `mode` — so it's a per-post decision.

---

## 7. Notes & gotchas

- **The proofreader can't see front matter**, so it can never mangle your
  `title`/`tags`/`date`. It only edits prose and leaves fenced code alone by
  instruction — verify this holds on your first few security posts (exact
  commands/flags matter).
- **Idempotency:** the workflow only picks up `Ready to publish` pages and flips
  them to `Published`, so a post is processed once. If a run fails mid-way, the
  status stays `Ready` and it retries next tick.
- **Cost:** zero — proofreading runs on your local Ollama box. The only knob is
  latency; qwen3.6 on modest hardware still finishes a short post well inside
  the 5-minute poll window.
- **qwen3 thinking:** if edits come back wrapped in `<think>…</think>` or with
  stray reasoning, your Ollama build may not honour `"think": false` — the
  assemble node strips the tags, but you can also append `/no_think` to the
  system prompt as a belt-and-braces measure.
- **Self-hosted n8n:** no external npm modules are required — the block→Markdown
  converter is plain JS. If you'd rather use the `notion-to-md` library instead,
  set `NODE_FUNCTION_ALLOW_EXTERNAL_MODULES` and install it, but the inline
  converter avoids that.
- **Writing new posts by hand still works** — this pipeline is additive. `hugo
  new content/<section>/<slug>.md` and a `git push` publish exactly as before.
