const BLADES = {
  Time: {
    attackName: 'Chrono Slash',
    defendName: 'Temporal Guard',
    specialName: 'Age of Stillness',
    attackDamage: 100,
    ultimateHitCount: 10,
    ultimateDamagePerHit: 50,
    ultimateCritDamagePerHit: 100,
    focusCap: 10,
  },
  Electricity: {
    attackName: 'Volt Arc',
    defendName: 'Static Impulse',
    specialName: 'Thunderstorm',
    attackDamage: 80,
    critDamage: 160,
    critChance: 0.5,
    ultimateDamage: 300,
    focusCap: 10,
  },
};

const state = {
  player: {
    hp: 1000,
    def: 40,
    focus: 0,
    blade: 'Time',
    isDefending: false,
    actionsThisTurn: 1,
    pendingExtraTurn: 0,
    critBoostTurns: 0,
  },
  enemy: {
    hp: 1000,
    def: 40,
    focus: 0,
    blade: 'Electricity',
    isDefending: false,
    actionsThisTurn: 1,
    pendingExtraTurn: 0,
    critBoostTurns: 0,
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

function updateActionButtons() {
  const defendButton = document.querySelector('.action-button[data-action="defend"]');
  if (!defendButton) return;

  const defendDisabled = state.player.actionsThisTurn > 1;
  defendButton.disabled = defendDisabled;
  defendButton.style.opacity = defendDisabled ? '0.45' : '1';
  defendButton.title = defendDisabled ? 'Defend is disabled while your double-turn is active.' : 'Defend';
}

function updateUi() {
  playerHpEl.textContent = state.player.hp;
  playerFocusEl.textContent = state.player.focus;
  enemyHpEl.textContent = state.enemy.hp;
  enemyFocusEl.textContent = state.enemy.focus;
  playerBladeEl.textContent = `Blade: ${state.player.blade}`;
  enemyBladeEl.textContent = `Blade: ${state.enemy.blade}`;
  updateActionButtons();
}

function setStatus(message) {
  battleStatusEl.textContent = message;
}

function prepareActorTurn(actor) {
  if (actor.pendingExtraTurn > 0) {
    actor.actionsThisTurn = 2;
    actor.pendingExtraTurn = 0;
    actor.isDefending = false;
    return;
  }

  actor.actionsThisTurn = 1;
  actor.isDefending = false;
}

function getAttackDamage(attacker, defender) {
  const blade = BLADES[attacker.blade];

  if (attacker.blade === 'Time') {
    const base = blade.attackDamage;
    const reduced = base - defender.def;
    return Math.max(1, reduced);
  }

  if (attacker.blade === 'Electricity') {
    if (attacker.critBoostTurns > 0 || Math.random() < blade.critChance) {
      const critDamage = blade.critDamage;
      const reduced = critDamage - defender.def;
      return Math.max(1, reduced);
    }

    const reduced = blade.attackDamage - defender.def;
    return Math.max(1, reduced);
  }

  return 1;
}

function chooseEnemyAction() {
  const bladeStats = BLADES[state.enemy.blade];

  if (state.enemy.focus >= bladeStats.focusCap) {
    return 'special';
  }

  if (state.enemy.actionsThisTurn > 1) {
    return 'attack';
  }

  const actions = ['attack', 'defend'];
  return actions[Math.floor(Math.random() * actions.length)];
}

function applyBladeAction(actor, target, action) {
  const bladeStats = BLADES[actor.blade];

  if (action === 'attack') {
    const damage = getAttackDamage(actor, target);
    target.hp = clampValue(target.hp - damage, 0, 1000);
    addLog(`${actor.blade} uses ${bladeStats.attackName} for ${damage} damage.`);
    actor.focus = clampValue(actor.focus + 1, 0, bladeStats.focusCap);

    if (actor.blade === 'Electricity' && actor.critBoostTurns > 0) {
      actor.critBoostTurns = Math.max(0, actor.critBoostTurns - 1);
    }

    return;
  }

  if (action === 'defend') {
    actor.isDefending = true;

    if (actor.blade === 'Time') {
      actor.pendingExtraTurn = 1;
      addLog(`${actor.blade} uses ${bladeStats.defendName}. Next turn grants two actions.`);
    } else if (actor.blade === 'Electricity') {
      actor.critBoostTurns = 2;
      addLog(`${actor.blade} uses ${bladeStats.defendName}. Critical damage boost lasts for 2 turns.`);
    }

    actor.focus = clampValue(actor.focus + 1, 0, bladeStats.focusCap);
    return;
  }

  if (action === 'special') {
    if (actor.focus < bladeStats.focusCap) {
      addLog(`${actor.blade} does not have enough focus.`);
      return;
    }

    actor.focus = 0;

    if (actor.blade === 'Time') {
      let totalDamage = 0;
      for (let i = 0; i < bladeStats.ultimateHitCount; i += 1) {
        const hitDamage = Math.random() < 0.5 ? bladeStats.ultimateCritDamagePerHit : bladeStats.ultimateDamagePerHit;
        totalDamage += hitDamage;
      }
      target.hp = clampValue(target.hp - totalDamage, 0, 1000);
      addLog(`${actor.blade} unleashes ${bladeStats.specialName} for ${totalDamage} damage.`);
      return;
    }

    if (actor.blade === 'Electricity') {
      const damage = bladeStats.ultimateDamage - target.def;
      target.hp = clampValue(target.hp - Math.max(1, damage), 0, 1000);
      addLog(`${actor.blade} unleashes ${bladeStats.specialName} for ${Math.max(1, damage)} damage.`);
      return;
    }
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

  prepareActorTurn(state.enemy);

  while (state.enemy.actionsThisTurn > 0) {
    const enemyAction = chooseEnemyAction();
    state.enemy.isDefending = false;

    if (enemyAction === 'attack') {
      applyBladeAction(state.enemy, state.player, 'attack');
    } else if (enemyAction === 'defend') {
      applyBladeAction(state.enemy, state.player, 'defend');
    } else if (enemyAction === 'special') {
      applyBladeAction(state.enemy, state.player, 'special');
    }

    state.enemy.actionsThisTurn -= 1;
    state.player.isDefending = false;

    updateUi();
    if (finishTurnIfNeeded()) {
      return;
    }

    if (state.enemy.actionsThisTurn > 0) {
      setStatus('Enemy double-turn active. The enemy chooses another action.');
    }
  }
}

function handlePlayerAction(action) {
  if (state.isBattleOver) {
    return;
  }

  if (action === 'defend' && state.player.actionsThisTurn > 1) {
    return;
  }

  if (action === 'attack') {
    applyBladeAction(state.player, state.enemy, 'attack');
  } else if (action === 'defend') {
    applyBladeAction(state.player, state.enemy, 'defend');
  } else if (action === 'special') {
    applyBladeAction(state.player, state.enemy, 'special');
  }

  state.player.isDefending = false;
  state.player.actionsThisTurn -= 1;

  if (finishTurnIfNeeded()) {
    updateUi();
    return;
  }

  if (state.player.actionsThisTurn > 0) {
    setStatus('Double turn active. Choose your next move.');
    updateUi();
    return;
  }

  handleEnemyTurn();

  if (!state.isBattleOver) {
    state.turn += 1;
    prepareActorTurn(state.player);
    prepareActorTurn(state.enemy);
    setStatus(`Turn ${state.turn} begins. Choose your next move.`);
  }

  updateUi();
}

function resetBattle() {
  state.player.hp = 1000;
  state.player.def = 40;
  state.player.focus = 0;
  state.player.blade = 'Time';
  state.player.isDefending = false;
  state.player.actionsThisTurn = 1;
  state.player.pendingExtraTurn = 0;
  state.player.critBoostTurns = 0;

  state.enemy.hp = 1000;
  state.enemy.def = 40;
  state.enemy.focus = 0;
  state.enemy.blade = randomBlade();
  state.enemy.isDefending = false;
  state.enemy.actionsThisTurn = 1;
  state.enemy.pendingExtraTurn = 0;
  state.enemy.critBoostTurns = 0;

  state.log = [];
  state.turn = 1;
  state.isBattleOver = false;

  prepareActorTurn(state.player);
  prepareActorTurn(state.enemy);

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
