# CLAUDE.md - Project Instructions

## Allowed Commands

Claude Code has explicit permission to run the following without requiring user approval:

### Git
- All git commands: `git status`, `git diff`, `git log`, `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git checkout`, `git branch`, `git merge`, `git stash`, `git rm`, `git remote`, etc.

### Node.js / npm
- `npm run build`, `npm run dev`, `npm run start`, `npm run lint`
- `npm install`, `npm ci`
- `npx` commands

### Firebase
- `npx firebase deploy`
- `npx firebase apphosting:rollouts:create`
- `npx firebase apphosting:backends:list`
- `npx firebase apphosting:backends:get`
- `npx firebase use`
- Any other `npx firebase` commands

### Shell
- `curl` for testing endpoints
- `ls`, `mkdir`, `rm` for file operations
- `kill`, `lsof` for process management
- Any general bash commands needed for development

## Project Structure

- **Git root**: `/Users/alanbalcom/Desktop/snapshot/`
- **Next.js app**: `/Users/alanbalcom/Desktop/snapshot/gtt-snapshot/`
- **Firebase project**: `gtt-country-snapshot`
- **App Hosting backend**: `gtt-snapshot`
- **Production URL**: `https://gtt-country-snapshot.web.app`
- **App Hosting URL**: `https://gtt-snapshot--gtt-country-snapshot.us-east4.hosted.app`

## Deploy Process

1. Push to `main` branch
2. Run `npx firebase apphosting:rollouts:create gtt-snapshot --git-branch main`
3. Wait ~5 minutes for build to complete
4. Verify at `https://gtt-country-snapshot.web.app`

## Known Issues

- Firebase App Hosting adapter is `nextjs-14.0.21` but app uses Next.js 16.1.6
- Middleware is incompatible with the adapter (removed; using server-side `requireAdmin()` checks in each admin page)
- Firebase Hosting strips ALL cookies except `__session` — auth cookie MUST be named `__session`
- All admin pages must use `export const dynamic = 'force-dynamic'` to avoid prerender 404s
- When testing with curl in zsh, `!` gets escaped — use `-d @file` with a JSON file instead of inline `-d '...'`
