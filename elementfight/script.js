const BLADES = {
  Time: {
    attackName: 'Chrono Slash',
    defendName: 'Temporal Guard',
    specialName: 'Age of Stillness',
    baseDef: 40,
    baseDmg: 60,
    focusCap: 10,
  },
  Electricity: {
    attackName: 'Volt Arc',
    defendName: 'Static Impulse',
    specialName: 'Thunderstorm',
    baseDef: 40,
    baseDmg: 60,
    focusCap: 10,
  },
};

const state = {
  player: {
    hp: 1000,
    focus: 0,
    blade: 'Time',
    isDefending: false,
  },
  enemy: {
    hp: 1000,
    focus: 0,
    blade: 'Electricity',
    isDefending: false,
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

function getDef(unit) {
  return BLADES[unit.blade].baseDef;
}

function calculateDamage(attacker, defender) {
  const attackPower = BLADES[attacker.blade].baseDmg;
  const defenderDef = getDef(defender);
  const baseDamage = attackPower - defenderDef;

  if (defender.isDefending) {
    return Math.max(1, Math.floor(baseDamage * 0.7));
  }

  return Math.max(1, baseDamage);
}

function chooseEnemyAction() {
  const bladeStats = BLADES[state.enemy.blade];

  if (state.enemy.focus >= bladeStats.focusCap) {
    return 'special';
  }

  const actions = ['attack', 'defend', 'heal'];
  return actions[Math.floor(Math.random() * actions.length)];
}

function applyBladeAction(actor, target, action) {
  const bladeStats = BLADES[actor.blade];

  if (action === 'attack') {
    const damage = calculateDamage(actor, target);
    target.hp = clampValue(target.hp - damage, 0, 1000);
    addLog(`${actor.blade} uses ${bladeStats.attackName} for ${damage} damage.`);
    actor.focus = clampValue(actor.focus + 1, 0, bladeStats.focusCap);
    return;
  }

  if (action === 'defend') {
    actor.isDefending = true;
    addLog(`${actor.blade} uses ${bladeStats.defendName}.`);
    actor.focus = clampValue(actor.focus + 1, 0, bladeStats.focusCap);
    return;
  }

  if (action === 'heal') {
    const heal = 80;
    actor.hp = clampValue(actor.hp + heal, 0, 1000);
    addLog(`${actor.blade} recovers ${heal} HP.`);
    actor.focus = clampValue(actor.focus + 1, 0, bladeStats.focusCap);
    return;
  }

  if (action === 'special') {
    if (actor.focus < bladeStats.focusCap) {
      addLog(`${actor.blade} does not have enough focus.`);
      return;
    }

    actor.focus = 0;
    const damage = calculateDamage(actor, target) * 2;
    target.hp = clampValue(target.hp - damage, 0, 1000);
    addLog(`${actor.blade} unleashes ${bladeStats.specialName} for ${damage} damage.`);
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
  state.enemy.isDefending = false;

  if (enemyAction === 'attack') {
    applyBladeAction(state.enemy, state.player, 'attack');
  } else if (enemyAction === 'defend') {
    applyBladeAction(state.enemy, state.player, 'defend');
  } else if (enemyAction === 'heal') {
    applyBladeAction(state.enemy, state.player, 'heal');
  } else if (enemyAction === 'special') {
    applyBladeAction(state.enemy, state.player, 'special');
  }

  state.player.isDefending = false;

  updateUi();
  finishTurnIfNeeded();
}

function handlePlayerAction(action) {
  if (state.isBattleOver) {
    return;
  }

  state.player.isDefending = false;

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
  state.player.focus = 0;
  state.player.blade = 'Time';
  state.player.isDefending = false;

  state.enemy.hp = 1000;
  state.enemy.focus = 0;
  state.enemy.blade = randomBlade();
  state.enemy.isDefending = false;

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
