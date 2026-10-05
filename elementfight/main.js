import { createGameState } from './state.js';

import {
  getKit
} from './kits/index.js';

import { UI } from './ui.js';

import { Combat } from './combat.js';

import { Game } from './game.js';


const ui =
  new UI();


const state =
  createGameState('Time');


const combat =
  new Combat(
    state,
    getKit,
    ui
  );


const game =
  new Game(
    ui,
    combat
  );


document
  .getElementById('restartBtn')
  .addEventListener(
    'click',
    () => game.reset()
  );


game.reset();
