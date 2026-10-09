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
  createGameState(null);


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


const soloModeBtn =
  document.getElementById('soloModeBtn');

const localPvpBtn =
  document.getElementById('localPvpBtn');

function updateModeButtons(mode) {
  const isPvp = mode === 'pvp';

  soloModeBtn.classList.toggle('active', !isPvp);
  soloModeBtn.setAttribute('aria-pressed', String(!isPvp));

  localPvpBtn.classList.toggle('active', isPvp);
  localPvpBtn.setAttribute('aria-pressed', String(isPvp));
}

document
  .getElementById('restartBtn')
  .addEventListener(
    'click',
    () => game.reset()
  );

soloModeBtn.addEventListener('click', () => {
  game.reset('ai');
  updateModeButtons('ai');
});

localPvpBtn.addEventListener('click', () => {
  game.reset('pvp');
  updateModeButtons('pvp');
});

game.reset('ai');
updateModeButtons('ai');
