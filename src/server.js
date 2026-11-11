import pkg from 'boardgame.io/dist/cjs/server.js';
const { Server, Origins } = pkg;
import { Splendor } from './Game.js';
import { Ito } from './ItoGame.js';
import { Haa } from './HaaGame.js';
import { Propose } from './ProposeGame.js';
import { HanninGame } from './HanninGame.js';
import { CrashIceGame } from './CrashIceGame.js';
import { NimmtGame } from './NimmtGame.js';
import { IndigoGame } from './IndigoGame.js';
import { JinseiGame } from './JinseiGame.js';
import { DeepSeaGame } from './DeepSeaGame.js';
import { OnsokuGame } from './OnsokuGame.js';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Server({
  games: [Splendor, Ito, Haa, Propose, HanninGame, CrashIceGame, NimmtGame, IndigoGame, JinseiGame, DeepSeaGame, OnsokuGame],
  origins: [Origins.ANY],
});

// Persistent Room Hub store: allows switching games in the same room and joining on rematch
const hubs = new Map();

const readJsonBody = (req) => new Promise((resolve) => {
  let raw = '';
  req.on('data', (chunk) => {
    if (raw.length < 65536) raw += chunk;
  });
  req.on('end', () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
  });
  req.on('error', () => resolve({}));
});

const findHub = (idOrMatch) => {
  if (!idOrMatch) return null;
  if (hubs.has(idOrMatch)) return hubs.get(idOrMatch);
  for (const h of hubs.values()) {
    if (h.matchID === idOrMatch) return h;
    if (Array.isArray(h.pastMatchIDs) && h.pastMatchIDs.includes(idOrMatch)) return h;
  }
  return null;
};

const pruneHub = (hub) => {
  const now = Date.now();
  for (const [cid, m] of Object.entries(hub.members)) {
    if (now - m.lastSeen > 90_000) {
      delete hub.members[cid];
    }
  }
};

const serializeHub = (hub) => {
  pruneHub(hub);
  return {
    hubId: hub.hubId,
    gameType: hub.gameType,
    matchID: hub.matchID,
    numPlayers: hub.numPlayers,
    version: hub.version,
    members: Object.values(hub.members).sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0) || a.joinedAt - b.joinedAt),
    updatedAt: hub.updatedAt,
  };
};

server.app.use(async (ctx, next) => {
  if (!ctx.path.startsWith('/api/hub')) {
    return next();
  }

  // Lazy cleanup of stale hubs (> 12h idle)
  const now = Date.now();
  for (const [hid, h] of hubs.entries()) {
    if (now - h.updatedAt > 12 * 3600 * 1000) hubs.delete(hid);
  }

  if (ctx.method === 'POST' && ctx.path === '/api/hub/create') {
    const body = await readJsonBody(ctx.req);
    const hubId = (body.hubId || body.matchID || '').trim();
    if (!hubId || !body.gameType || !body.matchID) {
      ctx.status = 400;
      ctx.body = { error: 'Missing hubId/gameType/matchID' };
      return;
    }
    const members = {};
    if (body.clientId) {
      members[body.clientId] = {
        clientId: body.clientId,
        name: body.name || 'Player 0',
        avatar: body.avatar || '🐱',
        isHost: true,
        status: 'playing',
        joinedAt: now,
        lastSeen: now,
      };
    }
    const hub = {
      hubId,
      gameType: body.gameType,
      matchID: body.matchID,
      pastMatchIDs: [body.matchID],
      numPlayers: Number(body.numPlayers) || 4,
      version: 1,
      members,
      updatedAt: now,
    };
    hubs.set(hubId, hub);
    ctx.status = 200;
    ctx.body = serializeHub(hub);
    return;
  }

  const matchGet = ctx.path.match(/^\/api\/hub\/([^/]+)$/);
  if (ctx.method === 'GET' && matchGet) {
    const hub = findHub(decodeURIComponent(matchGet[1]));
    if (!hub) {
      ctx.status = 404;
      ctx.body = { error: 'Hub not found' };
      return;
    }
    ctx.status = 200;
    ctx.body = serializeHub(hub);
    return;
  }

  const matchAction = ctx.path.match(/^\/api\/hub\/([^/]+)\/(heartbeat|switch|leave)$/);
  if (ctx.method === 'POST' && matchAction) {
    const targetId = decodeURIComponent(matchAction[1]);
    const action = matchAction[2];
    const body = await readJsonBody(ctx.req);
    let hub = findHub(targetId);

    // If a client heartbeats or switches a match created before hub existed, auto-bootstrap hub seamlessly
    if (!hub && (action === 'heartbeat' || action === 'switch') && body.gameType && body.matchID) {
      hub = {
        hubId: targetId,
        gameType: body.gameType,
        matchID: body.matchID,
        pastMatchIDs: [body.matchID],
        numPlayers: Number(body.numPlayers) || 4,
        version: 1,
        members: {},
        updatedAt: now,
      };
      hubs.set(targetId, hub);
    }

    if (!hub) {
      ctx.status = 404;
      ctx.body = { error: 'Hub not found' };
      return;
    }

    if (action === 'heartbeat') {
      if (body.clientId) {
        const existing = hub.members[body.clientId];
        hub.members[body.clientId] = {
          clientId: body.clientId,
          name: body.name || existing?.name || 'Player',
          avatar: body.avatar || existing?.avatar || '🐱',
          isHost: existing ? existing.isHost : !!body.isHost,
          status: body.status || existing?.status || 'playing',
          joinedAt: existing?.joinedAt || now,
          lastSeen: now,
        };
      }
      ctx.status = 200;
      ctx.body = serializeHub(hub);
      return;
    }

    if (action === 'switch') {
      if (!body.gameType || !body.matchID) {
        ctx.status = 400;
        ctx.body = { error: 'Missing gameType/matchID' };
        return;
      }
      if (!Array.isArray(hub.pastMatchIDs)) {
        hub.pastMatchIDs = hub.matchID ? [hub.matchID] : [];
      }
      if (hub.matchID && !hub.pastMatchIDs.includes(hub.matchID)) {
        hub.pastMatchIDs.push(hub.matchID);
      }
      if (!hub.pastMatchIDs.includes(body.matchID)) {
        hub.pastMatchIDs.push(body.matchID);
      }
      if (hub.pastMatchIDs.length > 30) {
        hub.pastMatchIDs = hub.pastMatchIDs.slice(-30);
      }
      hub.gameType = body.gameType;
      hub.matchID = body.matchID;
      hub.numPlayers = Number(body.numPlayers) || hub.numPlayers;
      hub.version += 1;
      hub.updatedAt = now;
      if (body.clientId && hub.members[body.clientId]) {
        hub.members[body.clientId].status = 'playing';
        hub.members[body.clientId].lastSeen = now;
      }
      ctx.status = 200;
      ctx.body = serializeHub(hub);
      return;
    }

    if (action === 'leave') {
      if (body.clientId) {
        delete hub.members[body.clientId];
      }
      ctx.status = 200;
      ctx.body = { ok: true };
      return;
    }
  }

  return next();
});

// Serve the compiled frontend
server.app.use(serve(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 8000;
server.run(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
