import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { assertProductionConfig, env, isAllowedOrigin } from "./env";
import { migrate } from "./db";
import { discoverOnce, enrichSocialProfiles, ingestBoard, ingestFeed } from "./discover";
import {
  listEvents,
  listTape,
  listWallets,
  loadFromDb,
  onLive,
  patchWallet,
  seedKnown,
  snapshot,
  stats,
  takeDirty,
  upsertWallet,
} from "./store";
import { isFullAddress } from "./util";

const start = async () => {
  assertProductionConfig();
  await migrate();
  await loadFromDb();
  seedKnown();

  const app = Fastify({ logger: true, trustProxy: true });
  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  });
  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode || 400;
    reply.code(status >= 500 ? 500 : status).send({
      error: error instanceof Error ? error.message : "Request failed",
    });
  });

  app.get("/health", async () => ({
    ok: true,
    service: "plumelist",
    chainId: 4663,
    ...stats(),
  }));

  app.get("/snapshot", async () => snapshot());

  app.get("/wallets", async (request) => {
    const query = request.query as { status?: string; q?: string };
    const status = ["seen", "candidate", "trackable", "good", "stale"].includes(String(query.status || ""))
      ? (query.status as "seen" | "candidate" | "trackable" | "good" | "stale")
      : undefined;
    return { wallets: listWallets({ status, q: query.q }), stats: stats() };
  });

  app.get("/tape", async (request) => {
    const query = request.query as { limit?: string };
    const limit = Math.min(400, Math.max(20, Number(query.limit || 400)));
    return { tape: listTape(limit) };
  });

  app.get("/events", async () => ({ events: listEvents() }));

  app.post("/wallets", async (request, reply) => {
    const body = (request.body || {}) as { address?: string; name?: string; twitter?: string; emoji?: string };
    const address = String(body.address || "").trim();
    if (!isFullAddress(address)) {
      return reply.code(400).send({ error: "Paste a full 0x Robinhood Chain address" });
    }
    const { wallet, created } = upsertWallet({
      address,
      name: body.name,
      twitter: body.twitter || null,
      emoji: body.emoji || "+",
      source: "user",
      watched: true,
    });
    return { wallet, created };
  });

  app.patch("/wallets/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const body = (request.body || {}) as {
      watched?: boolean;
      hidden?: boolean;
      name?: string;
      emoji?: string;
    };
    const wallet = patchWallet(params.id, body);
    if (!wallet) return reply.code(404).send({ error: "Wallet not found" });
    return { wallet };
  });

  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`api listening on ${env.port}`);
  const io = new Server(app.server, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    socket.emit("snapshot", snapshot());
  });
  onLive((payload) => {
    io.emit(payload.type, payload.data);
  });

  const feedLoop = async () => {
    try {
      await ingestFeed();
    } catch (error) {
      app.log.warn({ err: error }, "feed poll failed");
    }
  };
  const boardLoop = async () => {
    try {
      await ingestBoard("24h");
    } catch (error) {
      app.log.warn({ err: error }, "board poll failed");
    }
  };

  setInterval(() => void feedLoop(), env.feedMs);
  setInterval(() => void boardLoop(), env.boardMs);
  setInterval(() => {
    void enrichSocialProfiles(16).catch((error) => {
      app.log.warn({ err: error }, "social enrich failed");
    });
  }, 120000);
  setInterval(() => {
    if (takeDirty()) io.emit("snapshot", snapshot());
  }, 2000);

  try {
    const first = await discoverOnce();
    app.log.info({ first }, "initial discover");
  } catch (error) {
    app.log.warn({ err: error }, "initial discover failed");
  }
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
