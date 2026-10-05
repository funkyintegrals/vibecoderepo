const ELEMENTS = {
  Fire: { strongAgainst: ['Earth'], weakAgainst: ['Water'] },
  Water: { strongAgainst: ['Fire'], weakAgainst: ['Air'] },
  Earth: { strongAgainst: ['Air'], weakAgainst: ['Fire'] },
  Air: { strongAgainst: ['Water'], weakAgainst: ['Earth'] },
};

const state = {
  player: {
    hp: 100,
    mana: 10,
    element: 'Fire',
    isDefending: false,
  },
  enemy: {
    hp: 100,
    mana: 10,
    element: 'Water',
    isDefending: false,
  },
  log: [],
  turn: 1,
  isBattleOver: false,
};

const playerHpEl = document.getElementById('playerHp');
const playerManaEl = document.getElementById('playerMana');
const enemyHpEl = document.getElementById('enemyHp');
const enemyManaEl = document.getElementById('enemyMana');
const playerElementEl = document.getElementById('playerElement');
const enemyElementEl = document.getElementById('enemyElement');
const battleStatusEl = document.getElementById('battleStatus');
const battleLogEl = document.getElementById('battleLog');
const restartBtn = document.getElementById('restartBtn');

function randomElement() {
  const keys = Object.keys(ELEMENTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
  playerManaEl.textContent = state.player.mana;
  enemyHpEl.textContent = state.enemy.hp;
  enemyManaEl.textContent = state.enemy.mana;
  playerElementEl.textContent = `Element: ${state.player.element}`;
  enemyElementEl.textContent = `Element: ${state.enemy.element}`;
}

function setStatus(message) {
  battleStatusEl.textContent = message;
}

function getDamageMultiplier(attackerElement, defenderElement) {
  const attacker = ELEMENTS[attackerElement];
  const defender = ELEMENTS[defenderElement];

  if (attacker.strongAgainst.includes(defenderElement)) {
    return 1.4;
  }

  if (attacker.weakAgainst.includes(defenderElement)) {
    return 0.7;
  }

  if (attackerElement === defenderElement) {
    return 1;
  }

  return 1;
}

function applyDamage(target, source, baseDamage) {
  const multiplier = getDamageMultiplier(source.element, target.element);
  const damage = Math.round(baseDamage * multiplier);
  target.hp = clampValue(target.hp - damage, 0, 100);

  addLog(`${source.element} strike deals ${damage} damage to ${target.element}.`);
  return damage;
}

function canUseSpecial(unit) {
  return unit.mana >= 3;
}

function chooseEnemyAction() {
  const options = ['attack', 'defend', 'heal', 'special'];
  const choice = options[Math.floor(Math.random() * options.length)];

  if (choice === 'special' && state.enemy.mana < 3) {
    return 'attack';
  }

  return choice;
}

function resolveAction(actor, target, action) {
  if (state.isBattleOver) {
    return;
  }

  actor.isDefending = false;

  if (action === 'attack') {
    const damage = 12 + Math.floor(Math.random() * 8);
    target.hp = clampValue(target.hp - damage, 0, 100);
    addLog(`${actor.element} attacker hits for ${damage}.`);
    return;
  }

  if (action === 'defend') {
    actor.isDefending = true;
    addLog(`${actor.element} user braces for impact.`);
    return;
  }

  if (action === 'heal') {
    const heal = 14 + Math.floor(Math.random() * 8);
    actor.hp = clampValue(actor.hp + heal, 0, 100);
    addLog(`${actor.element} user restores ${heal} HP.`);
    return;
  }

  if (action === 'special') {
    if (actor.mana < 3) {
      addLog(`${actor.element} user lacks enough mana for a special move.`);
      return;
    }

    actor.mana -= 3;
    const damage = 22 + Math.floor(Math.random() * 10);
    target.hp = clampValue(target.hp - damage, 0, 100);
    addLog(`${actor.element} special attack deals ${damage}!`);
  }
}

function finishTurnIfNeeded() {
  if (state.player.hp <= 0) {
    state.isBattleOver = true;
    setStatus('You were defeated. Press New Battle to try again.');
    addLog('Battle lost.');
    return true;
  }

  if (state.enemy.hp <= 0) {
    state.isBattleOver = true;
    setStatus('Victory! The enemy falls.');
    addLog('Battle won.');
    return true;
  }

  return false;
}

function enemyTurn() {
  if (state.isBattleOver) {
    return;
  }

  const action = chooseEnemyAction();
  const enemyActor = { ...state.enemy, element: state.enemy.element };
  const playerActor = { ...state.player, element: state.player.element };

  if (action === 'defend') {
    state.enemy.isDefending = true;
    addLog('Enemy raises a barrier.');
  } else if (action === 'heal') {
    state.enemy.hp = clampValue(state.enemy.hp + 12, 0, 100);
    addLog('Enemy restores 12 HP.');
  } else if (action === 'special') {
    if (state.enemy.mana >= 3) {
      state.enemy.mana -= 3;
      const damage = 20 + Math.floor(Math.random() * 10);
      state.player.hp = clampValue(state.player.hp - damage, 0, 100);
      addLog(`Enemy unleashes a special blast for ${damage}!`);
    } else {
      const damage = 12 + Math.floor(Math.random() * 8);
      state.player.hp = clampValue(state.player.hp - damage, 0, 100);
      addLog(`Enemy strikes for ${damage}.`);
    }
  } else {
    const damage = 12 + Math.floor(Math.random() * 10);
    state.player.hp = clampValue(state.player.hp - damage, 0, 100);
    addLog(`Enemy attacks for ${damage}.`);
  }

  if (state.player.isDefending) {
    state.player.hp = clampValue(state.player.hp + 8, 0, 100);
    state.player.isDefending = false;
    addLog('Your guard absorbs some damage.');
  }

  if (state.enemy.isDefending) {
    state.enemy.hp = clampValue(state.enemy.hp + 6, 0, 100);
    state.enemy.isDefending = false;
    addLog('Enemy guard stabilizes them.');
  }

  state.player.mana = clampValue(state.player.mana + 1, 0, 10);
  state.enemy.mana = clampValue(state.enemy.mana + 1, 0, 10);

  updateUi();
  finishTurnIfNeeded();
}

function handlePlayerAction(action) {
  if (state.isBattleOver) {
    return;
  }

  const playerAction = action;
  const enemyAction = chooseEnemyAction();

  state.player.isDefending = false;
  state.enemy.isDefending = false;

  if (playerAction === 'attack') {
    const damage = 12 + Math.floor(Math.random() * 10);
    const multiplier = getDamageMultiplier(state.player.element, state.enemy.element);
    const total = Math.round(damage * multiplier);
    state.enemy.hp = clampValue(state.enemy.hp - total, 0, 100);
    addLog(`You attack with ${state.player.element} for ${total} damage.`);
  } else if (playerAction === 'defend') {
    state.player.isDefending = true;
    addLog('You raise your guard.');
  } else if (playerAction === 'heal') {
    const heal = 15;
    state.player.hp = clampValue(state.player.hp + heal, 0, 100);
    addLog(`You restore ${heal} HP.`);
  } else if (playerAction === 'special') {
    if (state.player.mana < 3) {
      addLog('Not enough mana for a special move.');
      return;
    }

    state.player.mana -= 3;
    const damage = 22 + Math.floor(Math.random() * 12);
    const total = Math.round(damage * getDamageMultiplier(state.player.element, state.enemy.element));
    state.enemy.hp = clampValue(state.enemy.hp - total, 0, 100);
    addLog(`You unleash a special ${state.player.element} move for ${total} damage.`);
  }

  if (state.player.isDefending) {
    state.player.hp = clampValue(state.player.hp + 5, 0, 100);
  }

  if (enemyAction === 'defend') {
    state.enemy.isDefending = true;
    addLog('Enemy prepares a defense.');
  } else if (enemyAction === 'heal') {
    state.enemy.hp = clampValue(state.enemy.hp + 12, 0, 100);
    addLog('Enemy heals 12 HP.');
  } else if (enemyAction === 'special') {
    if (state.enemy.mana >= 3) {
      state.enemy.mana -= 3;
      const enemyDamage = 20 + Math.floor(Math.random() * 8);
      state.player.hp = clampValue(state.player.hp - enemyDamage, 0, 100);
      addLog(`Enemy special attack hits for ${enemyDamage}.`);
    } else {
      const enemyDamage = 10 + Math.floor(Math.random() * 7);
      state.player.hp = clampValue(state.player.hp - enemyDamage, 0, 100);
      addLog(`Enemy attacks for ${enemyDamage}.`);
    }
  } else {
    const enemyDamage = 10 + Math.floor(Math.random() * 10);
    state.player.hp = clampValue(state.player.hp - enemyDamage, 0, 100);
    addLog(`Enemy attacks for ${enemyDamage}.`);
  }

  state.player.mana = clampValue(state.player.mana + 1, 0, 10);
  state.enemy.mana = clampValue(state.enemy.mana + 1, 0, 10);

  updateUi();

  if (finishTurnIfNeeded()) {
    return;
  }

  const nextTurn = `Turn ${state.turn + 1} begins.`;
  state.turn += 1;
  setStatus(nextTurn);
}

function resetBattle() {
  state.player.hp = 100;
  state.player.mana = 10;
  state.player.element = 'Fire';
  state.player.isDefending = false;

  state.enemy.hp = 100;
  state.enemy.mana = 10;
  state.enemy.element = randomElement();
  state.enemy.isDefending = false;

  state.log = [];
  state.turn = 1;
  state.isBattleOver = false;

  addLog('A new battle begins.');
  setStatus('Choose your move.');
  updateUi();
}

document.querySelectorAll('.element-button').forEach((button) => {
  button.addEventListener('click', () => {
    if (state.isBattleOver) {
      return;
    }

    const selected = button.dataset.element;
    state.player.element = selected;

    document.querySelectorAll('.element-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.element === selected);
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
updateUi();
