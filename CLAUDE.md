# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

闘金情報スレ掲示板 (yamikinjouhousure) - A 5chan-style anonymous bulletin board system for sharing loan shark information. Built with SvelteKit 2, Svelte 5, TypeScript, SQLite (Drizzle ORM), and deployed via Docker/Coolify.

## Development Commands

```bash
# Development server (port 5173)
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Preview production build
npm run preview

# Database commands (Drizzle)
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio GUI
```

## Architecture

### Tech Stack
- **Framework**: SvelteKit 2 with Node adapter (SSR)
- **UI**: Svelte 5 with `$state`/`$props` runes
- **Database**: SQLite with Drizzle ORM, WAL mode enabled
- **Auth**: Cookie-based sessions (SHA256 password hashing)

### Key Directories
```
src/
├── hooks.server.ts      # DB initialization, creates tables on startup
├── lib/
│   ├── db/
│   │   ├── index.ts     # DB connection (process.env.DATABASE_PATH)
│   │   └── schema.ts    # 4 tables: threads, posts, banned_ips, admins
│   └── utils/
│       ├── id.ts        # User ID generation, tripcode, momentum calc
│       └── post.ts      # HTML escape, anchor/URL processing
└── routes/
    ├── search/          # Thread list with momentum sorting
    ├── test/read.cgi/debt/[id]/  # Thread detail + post form
    ├── admin/           # Login page
    └── admin/dashboard/ # Thread/post/IP/admin management
```

### Database Schema
- **threads**: id, thread_number, title, created_at, updated_at, post_count, is_archived
- **posts**: id, thread_id, post_number, name, trip, email, body, ip_address, user_id, created_at, is_deleted, is_admin
- **banned_ips**: id, ip_address, reason, created_at, expires_at
- **admins**: id, username, password (SHA256), role (superadmin/admin), created_at, created_by

### Routing Pattern
- `/search?q=query` - Thread listing
- `/test/read.cgi/debt/{id}` - Thread view (5ch URL style)
- `/admin` - Login
- `/admin/dashboard` - Admin panel

### Key Patterns
- **Form Actions**: SvelteKit `?/action` pattern for mutations
- **Daily User IDs**: IP + date + secret → SHA256 → 9 chars
- **Tripcode**: `name#password` → `◆{hash}`
- **Sage**: `email=sage` prevents thread bump
- **Auto-archive**: Threads lock at 1000 posts
- **Momentum**: `post_count / days_elapsed` for sorting

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ADMIN_PASSWORD` | 5151test | Initial superadmin password |
| `SECRET_KEY` | default-secret-key | User ID generation salt |
| `DATABASE_PATH` | ./data/sqlite.db | SQLite file location |

## Deployment

### 本番環境情報（重要）

| 項目 | 値 |
|------|-----|
| **本番サーバーIP** | `185.215.164.169` |
| **Coolify URL** | `http://185.215.164.169:8000` |
| **本番ドメイン** | `egg5ch.net` |
| **Cloudflare Zone ID** | `9c08fc24e1d2e3feb72c323670ec4ebb` |

**注意**: このサーバー（開発環境）のIPと本番サーバーのIPは異なります。デプロイは必ずCoolify経由で行うこと。

### Coolifyデプロイ手順

1. Coolify (`http://185.215.164.169:8000`) にログイン
2. yamikinjouhousureプロジェクトを選択
3. 「Deploy」ボタンでデプロイ実行

### Docker設定

Docker multi-stage build with production target. Coolify deployment requires:
- Volume mount for `/app/data` (database persistence)
- Environment variables set in Coolify dashboard
- CSRF disabled in svelte.config.js for Cloudflare proxy compatibility

## Styling

5ch retro aesthetic: MS PGothic/Meiryo fonts, link blue (#0000cc), name green (#008000), admin red (★ marker).
