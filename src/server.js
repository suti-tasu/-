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
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Server({
  games: [Splendor, Ito, Haa, Propose, HanninGame, CrashIceGame, NimmtGame, IndigoGame, JinseiGame],
  origins: [Origins.ANY],
});

// Serve the compiled frontend
server.app.use(serve(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 8000;
server.run(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
