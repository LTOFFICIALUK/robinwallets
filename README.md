# robinwallets

ASCII wallet tracker for Robinhood Chain (chain id 4663). Discovers high-frequency traders, promotes them to **trackable** / **good** as activity lands, and streams the tape.

| Package | Role |
| --- | --- |
| `database/` | Postgres schema |
| `server/` | Discovery, scoring, REST + Socket.IO |
| `frontend/` | ASCII terminal UI |

## Local

```bash
cd server && npm install && npm run dev
# other terminal
cd frontend && npm install && npm run dev
```

Open http://localhost:3020. Server is http://localhost:4020.

Postgres is optional in development — without `DATABASE_URL` the API keeps state in memory. Set `DATABASE_URL` for persistence.
