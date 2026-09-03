# PlumeList database

Postgres schema for Robinhood Chain wallet discovery, scoring, and the live trade tape.

Railway (or any Postgres) provisions the service. The API applies `schema.sql` on boot via `migrate()`, or you can run it once against `DATABASE_URL`.
