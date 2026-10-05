const BLADES = {
  Time: {
    attackName: 'Chrono Slash',
    defendName: 'Temporal Guard',
    specialName: 'Age of Stillness',
    attackPower: 45,
    specialPower: 120,
    defenseBoost: 10,
    focusCost: 3,
  },
  Electricity: {
    attackName: 'Volt Arc',
    defendName: 'Static Impulse',
    specialName: 'Thunderstorm',
    attackPower: 50,
    specialPower: 130,
    defenseBoost: 8,
    focusCost: 3,
  },
};

const state = {
  player: {
    hp: 1000,
    defense: 40,
    focus: 10,
    blade: 'Time',
    isDefending: false,
    defendBuffExpires: 0,
  },
  enemy: {
    hp: 1000,
    defense: 40,
    focus: 10,
    blade: 'Electricity',
    isDefending: false,
    defendBuffExpires: 0,
  },
  log: [],
  turn: 1,
  isBattleOver: false,
};

const playerHpEl = document.getElementById('playerHp');
const playerFocusEl = document.getElementById('playerFocus');
const enemyHpEl = document.getElementById('enemyHp');
const enemyFocusEl = document.getElementById('enemyFocus');
const playerBladeEl = document.getElementById('playerBlade');
const enemyBladeEl = document.getElementById('enemyBlade');
const battleStatusEl = document.getElementById('battleStatus');
const battleLogEl = document.getElementById('battleLog');
const restartBtn = document.getElementById('restartBtn');

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBlade() {
  const blades = Object.keys(BLADES);
  return blades[Math.floor(Math.random() * blades.length)];
}

function addLog(message) {
  state.log.unshift(message);
  if (state.log.length > 8) {
    state.log.pop();
  }

  battleLogEl.innerHTML = state.log
    .map((entry) => `<li>${entry}</li>`)
    .join('');
}

function updateUi() {
  playerHpEl.textContent = state.player.hp;
  playerFocusEl.textContent = state.player.focus;
  enemyHpEl.textContent = state.enemy.hp;
  enemyFocusEl.textContent = state.enemy.focus;
  playerBladeEl.textContent = `Blade: ${state.player.blade}`;
  enemyBladeEl.textContent = `Blade: ${state.enemy.blade}`;
}

function setStatus(message) {
  battleStatusEl.textContent = message;
}

function chooseEnemyAction() {
  // If defend buff is expired, choose attack or special
  if (state.enemy.defendBuffExpires <= state.turn) {
    const actions = ['attack', 'special', 'heal'];
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  // If defend buff is still active, choose defend or attack
  const actions = ['defend', 'attack'];
  return actions[Math.floor(Math.random() * actions.length)];
}

function considerDefensiveReduction(unit) {
  if (unit.isDefending) {
    return 0.7;
  }
  return 1;
}

function applyBladeAction(actor, target, action) {
  const bladeStats = BLADES[actor.blade];

  if (action === 'attack') {
    const base = bladeStats.attackPower + Math.floor(Math.random() * 20);
    const reduced = Math.round(base * considerDefensiveReduction(target));
    const finalDamage = Math.max(1, reduced - target.defense);
    target.hp = clampValue(target.hp - finalDamage, 0, 1000);
    addLog(`${actor.blade} uses ${bladeStats.attackName} for ${finalDamage} damage.`);
    return;
  }

  if (action === 'defend') {
    actor.isDefending = true;
    actor.defendBuffExpires = state.turn + 2;
    addLog(`${actor.blade} uses ${bladeStats.defendName}. Buff expires in 2 turns.`);
    return;
  }

  if (action === 'heal') {
    const heal = 80;
    actor.hp = clampValue(actor.hp + heal, 0, 1000);
    addLog(`${actor.blade} recovers ${heal} HP.`);
    return;
  }

  if (action === 'special') {
    if (actor.focus < bladeStats.focusCost) {
      addLog(`${actor.blade} does not have enough focus.`);
      return;
    }

    actor.focus -= bladeStats.focusCost;
    const base = bladeStats.specialPower + Math.floor(Math.random() * 40);
    const reduced = Math.round(base * considerDefensiveReduction(target));
    const finalDamage = Math.max(1, reduced - target.defense);
    target.hp = clampValue(target.hp - finalDamage, 0, 1000);
    addLog(`${actor.blade} unleashes ${bladeStats.specialName} for ${finalDamage} damage.`);
  }
}

function finishTurnIfNeeded() {
  if (state.player.hp <= 0) {
    state.isBattleOver = true;
    setStatus('Defeat. Press New Battle to start again.');
    addLog('You lost the battle.');
    return true;
  }

  if (state.enemy.hp <= 0) {
    state.isBattleOver = true;
    setStatus('Victory! The enemy blade is broken.');
    addLog('You won the battle.');
    return true;
  }

  return false;
}

function handleEnemyTurn() {
  if (state.isBattleOver) {
    return;
  }

  const enemyAction = chooseEnemyAction();

  if (enemyAction === 'attack') {
    applyBladeAction(state.enemy, state.player, 'attack');
  } else if (enemyAction === 'defend') {
    applyBladeAction(state.enemy, state.player, 'defend');
  } else if (enemyAction === 'heal') {
    applyBladeAction(state.enemy, state.player, 'heal');
  } else {
    applyBladeAction(state.enemy, state.player, 'special');
  }

  state.player.focus = clampValue(state.player.focus + 1, 0, 10);
  state.enemy.focus = clampValue(state.enemy.focus + 1, 0, 10);

  state.player.isDefending = false;
  state.enemy.isDefending = false;

  updateUi();
  finishTurnIfNeeded();
}

function handlePlayerAction(action) {
  if (state.isBattleOver) {
    return;
  }

  if (action === 'attack') {
    applyBladeAction(state.player, state.enemy, 'attack');
  } else if (action === 'defend') {
    applyBladeAction(state.player, state.enemy, 'defend');
  } else if (action === 'heal') {
    applyBladeAction(state.player, state.enemy, 'heal');
  } else if (action === 'special') {
    applyBladeAction(state.player, state.enemy, 'special');
  }

  if (finishTurnIfNeeded()) {
    updateUi();
    return;
  }

  handleEnemyTurn();

  if (!state.isBattleOver) {
    state.turn += 1;
    setStatus(`Turn ${state.turn} begins. Choose your next move.`);
  }

  updateUi();
}

function resetBattle() {
  state.player.hp = 1000;
  state.player.defense = 40;
  state.player.focus = 10;
  state.player.blade = 'Time';
  state.player.isDefending = false;
  state.player.defendBuffExpires = 0;

  state.enemy.hp = 1000;
  state.enemy.defense = 40;
  state.enemy.focus = 10;
  state.enemy.blade = randomBlade();
  state.enemy.isDefending = false;
  state.enemy.defendBuffExpires = 0;

  state.log = [];
  state.turn = 1;
  state.isBattleOver = false;

  addLog(`Enemy chose ${state.enemy.blade}!`);
  addLog('A new blade duel begins.');
  setStatus('Choose your blade and move.');
  updateUi();
}

document.querySelectorAll('.blade-button').forEach((button) => {
  button.addEventListener('click', () => {
    if (state.isBattleOver) {
      return;
    }

    const selected = button.dataset.blade;
    state.player.blade = selected;

    document.querySelectorAll('.blade-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.blade === selected);
    });

    updateUi();
    setStatus(`${selected} selected. Choose your next action.`);
  });
});

document.querySelectorAll('.action-button').forEach((button) => {
  button.addEventListener('click', () => {
    handlePlayerAction(button.dataset.action);
  });
});

restartBtn.addEventListener('click', resetBattle);

resetBattle();
