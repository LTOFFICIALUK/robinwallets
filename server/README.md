# PlumeList server

Discovery + scoring API for Robinhood Chain wallets.

```bash
npm install
npm run dev
```

Listens on `PORT` (default 4020).

| Env | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres. Optional in dev (in-memory). |
| `CORS_ORIGIN` | Frontend origin(s), comma-separated |
| `SITE_URL` | Frontend URL |
| `FEED_MS` | KOL tape poll interval (default 8000) |
| `BOARD_MS` | Leaderboard poll interval (default 60000) |

Public MadeOnSol endpoints (`/api/rhc/kol-feed`, `/api/rhc/kol-leaderboard`) plus a seed of known high-frequency EVM wallets. Wallets start as `seen` / `candidate` and promote to `trackable` then `good` when a full address + recent activity land.
