import { Client } from 'boardgame.io/react';
import { HanninGame } from './HanninGame';
import { HanninBoard } from './HanninBoard';

export const HanninClient = Client({
  game: HanninGame,
  board: HanninBoard,
  numPlayers: 3, // Will be overridden dynamically by lobby
});
