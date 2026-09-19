import pkg from 'boardgame.io/dist/cjs/server.js';
const { Server, Origins } = pkg;
import { Splendor } from './Game.js';
import { Ito } from './ItoGame.js';
import { Haa } from './HaaGame.js';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Server({
  games: [Splendor, Ito, Haa],
  origins: [Origins.ANY],
});

// Serve the compiled frontend
server.app.use(serve(path.join(__dirname, '../dist')));

server.run(8000, () => {
  console.log('Server is running on port 8000...');
});
