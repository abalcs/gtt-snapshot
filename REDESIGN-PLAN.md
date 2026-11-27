# GTT Snapshot — Glow Up + Modularity Plan (LOCAL ONLY, nothing pushed)

Written 2026-11-26 for Alan's review. Production (gtt-country-snapshot.web.app) untouched.
Repo cloned locally at ~/workspace/gtt-snapshot (app in gtt-snapshot/ subfolder, branch feature/firebase-migration).

## What the site is today

- Next.js 16 + React 19, Tailwind 4, shadcn-style components, Firestore via firebase-admin.
- Deployed on Firebase App Hosting (project gtt-country-snapshot). Deploy = push to main + App Hosting rollout.
- Already data-driven: destinations, regions, tags, TCE articles, stop sells, email templates,
  travel data, users — all in Firestore with an admin section.
- Auth: custom user store, bcrypt passwords, `__session` cookie. Advisors view, Admins manage.

## The gaps vs "fully modular, colleague can run it"

1. **Only destinations and TCE articles can be created in admin.** Special sections can be
   edited but there is no create flow; every other page (Booking Calendars, Help Me Choose,
   What's New, TCE Resources, Stop Sells landing, Compare) is a hard-coded route. A new
   general page today needs a developer, a deploy, and a rollout.
2. **Navigation is part data, part code.** The sidebar pulls continents/destinations/special
   sections from the API, but the fixed tool pages are baked into the sidebar component.
3. **Rendering logic is duplicated.** The special-section page carries its own private
   markdown renderer; destination pages compose ~15 one-off components. Blocks are not shared.
4. **The visual design is stock shadcn zinc.** Functional, but it looks like a template,
   not like an Audley product. No brand type, no imagery, dense grey tables.

## The target architecture (what "modular" means here)

### 1. A Pages collection (the one big addition)
Every non-destination page becomes a document in a Firestore `pages` collection:

- `title`, `slug`, `icon` (from a fixed icon set), `summary`
- `placement`: sidebar section (Destinations / Resources / Tools / Help), `order`, `visible`
- `blocks`: an ordered list of content blocks (see below)
- `status`: draft / published

One dynamic route (`/p/[slug]`) renders any page from its blocks. One admin **Page Manager**
lists every page with create / edit / delete / reorder / show-hide. Deleting a page removes
it from the sidebar everywhere instantly; adding one needs no code and no deploy.
Special sections migrate into Pages (same content, same slugs, redirects kept).

### 2. A block registry (the modularity engine)
A page is a stack of blocks. Each block type is one small component registered once:

- Rich text (markdown), Heading, Callout (info / warning / tip), Link cards,
  Table, Image, Video embed, Destination list (auto from tags), People list,
  Accordion, Divider, Button / CTA

The editor adds, removes and drags blocks; the renderer is shared by every page,
so a design fix lands everywhere at once. This replaces the per-page markdown copies.

### 3. Navigation generated from data
The sidebar is built from three registries and nothing else: regions/destinations (as now),
published Pages (grouped by their placement), and a short declarative list of built-in tools
(Compare, Help Me Choose, Search) defined in one config file. No nav markup per page.

### 4. What stays exactly as it is
Destinations and their rich detail components, tags, stop sells, TCE articles, email
templates, travel data, analytics, feedback, users and roles, and the auth system.
The migration is additive: Pages + block renderer + nav registry + theme. Existing
admin screens keep working; the Page Manager sits alongside them.

## The glow up

- Brand system: warm ivory paper background, deep teal ink, gold accent — the Audley
  palette Alan uses on the CS Country Coverage app — Fraunces serif display headings
  with a clean sans for body and data.
- Home becomes a proper front door: big search first, region cards with flags,
  quick-action tiles for the daily tools, a What's New strip.
- Destination cards get flags, best-time and minimum-nights chips, capacity-style
  status colour, and consistent hover states. Detail pages get a sticky contents rail.
- Sidebar: dark teal, grouped, collapsible, with page visibility honoured from data.
- Same components, one theme file (CSS variables), so the colleague never touches design.

## Handover story

The colleague gets an Admin account and a one-page guide: Pages for content,
Destinations for country data, everything else unchanged. No GitHub, no deploys,
no code for day-to-day changes. Structural changes (new block types, new tools)
remain developer tasks by design.

## Sequence (each step gated on Alan)

1. Preview prototype in a Space: new look + working Page Manager demo. ← we are here
2. Alan tests, comments, approves direction.
3. Local branch in the repo: theme + block registry + Pages collection + Page Manager
   + nav registry, special sections migrated, verified against a local build.
4. Alan tests locally / on a staging rollout. Only then, with his explicit word:
   push to main and create the production rollout.
