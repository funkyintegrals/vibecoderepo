import { KITS } from './kits/index.js';

const BLADES = Object.keys(KITS);
const REPEATS = 5;
const MAX_TURNS = 100;

function createFighter(blade) {
  return {
    blade,
    hp: 2000,
    def: 50,
    focus: 0,
    isDefending: false,
    increasedCrits: 0,
    flashAttackStacks: 0,
    flashDefenseTurnsRemaining: 0,
    timeDoubleTurnPending: false,
    timeDoubleTurnActive: false,
    lightUltimateTurnsRemaining: 0,
    actionsThisTurn: 1
  };
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function applyDefense(rawDamage, defender) {
  const defense = defender.def * (
    defender.blade === 'Flash' && defender.flashDefenseTurnsRemaining > 0 ? 2 : 1
  );
  let damage = Math.max(1, rawDamage - defense);
  if (defender.isDefending) damage = Math.max(1, Math.floor(damage * 0.5));
  return damage;
}

function dealDamage(attacker, defender, rawDamage, critical) {
  let damage = applyDefense(rawDamage, defender);

  if (attacker.blade === 'Light' && attacker.lightUltimateTurnsRemaining > 0) {
    damage = Math.max(1, Math.floor(damage * 1.3));
  }
  if (defender.blade === 'Light' && defender.lightUltimateTurnsRemaining > 0) {
    damage = Math.max(1, Math.floor(damage * 0.7));
  }

  defender.hp = Math.max(0, defender.hp - damage);
  return damage;
}

function attack(fighter, enemy, random) {
  const kit = KITS[fighter.blade];
  let rawDamage;
  let critical = false;

  if (fighter.blade === 'Electricity') {
    if (fighter.increasedCrits > 0) {
      critical = random() < 0.75;
      fighter.increasedCrits--;
    } else {
      critical = random() < kit.criticalChance;
    }
    rawDamage = critical ? kit.criticalDamage : kit.attackDamage;
  } else if (fighter.blade === 'Flash') {
    rawDamage = Math.floor(
      kit.attackDamage * Math.pow(kit.attackMultiplierPerStack, fighter.flashAttackStacks)
    );
  } else {
    rawDamage = kit.attackDamage;
  }

  const damage = dealDamage(fighter, enemy, rawDamage, critical);

  if (fighter.blade === 'Light') {
    fighter.hp = Math.min(2000, fighter.hp + kit.attackHeal);
  }
  if (fighter.blade === 'Flash') fighter.flashAttackStacks++;

  fighter.focus = Math.min(kit.focusCap, fighter.focus + 1);
  return damage;
}

function utility(fighter, enemy, random) {
  const kit = KITS[fighter.blade];

  if (fighter.blade === 'Electricity') {
    if (fighter.increasedCrits > 0) return false;
    fighter.increasedCrits = kit.guaranteedCritAttacks;
  } else if (fighter.blade === 'Flash') {
    fighter.flashDefenseTurnsRemaining = 2;
    fighter.flashAttackStacks++;
  } else if (fighter.blade === 'Light') {
    const selfDamage = Math.min(kit.utilityCost, Math.max(0, fighter.hp - 1));
    fighter.hp = Math.max(1, fighter.hp - selfDamage);
    dealDamage(fighter, enemy, kit.utilityDamage, false);
  } else if (fighter.blade === 'Time') {
    if (fighter.timeDoubleTurnPending || fighter.timeDoubleTurnActive) return false;
    fighter.timeDoubleTurnPending = true;
  }

  fighter.focus = Math.min(kit.focusCap, fighter.focus + 1);
  return true;
}

function ultimate(fighter, enemy, random) {
  const kit = KITS[fighter.blade];
  if (fighter.focus < kit.focusCap) return false;

  fighter.focus = 0;

  if (fighter.blade === 'Electricity') {
    dealDamage(fighter, enemy, kit.ultimateDamage, false);
  } else if (fighter.blade === 'Light') {
    fighter.lightUltimateTurnsRemaining = kit.ultimateTurns;
  } else if (fighter.blade === 'Flash') {
    fighter.flashAttackStacks += kit.ultimateStacks;
  } else if (fighter.blade === 'Time') {
    for (let i = 0; i < kit.ultimate.hits && enemy.hp > 0; i++) {
      const critical = random() < kit.ultimate.criticalChance;
      const raw = critical ? kit.ultimate.criticalDamage : kit.ultimate.normalDamage;
      dealDamage(fighter, enemy, raw, critical);
    }
  }

  return true;
}

function beginTurn(fighter) {
  fighter.isDefending = false;
  if (fighter.flashDefenseTurnsRemaining > 0) fighter.flashDefenseTurnsRemaining--;

  if (fighter.timeDoubleTurnPending) {
    fighter.timeDoubleTurnPending = false;
    fighter.timeDoubleTurnActive = true;
    fighter.actionsThisTurn = 2;
  } else {
    if (fighter.timeDoubleTurnActive) fighter.timeDoubleTurnActive = false;
    fighter.actionsThisTurn = 1;
  }
}

function chooseAction(fighter, enemy) {
  const kit = KITS[fighter.blade];

  if (fighter.focus >= kit.focusCap) return 'special';

  if (fighter.actionsThisTurn > 1) return 'attack';

  if (fighter.blade === 'Time') {
    return fighter.timeDoubleTurnPending || fighter.timeDoubleTurnActive ? 'attack' : 'utility';
  }
  if (fighter.blade === 'Flash') {
    return fighter.flashDefenseTurnsRemaining > 0 ? 'attack' : 'utility';
  }
  if (fighter.blade === 'Electricity') {
    return fighter.increasedCrits > 0 ? 'attack' : 'utility';
  }
  if (fighter.blade === 'Light') {
    return fighter.lightUltimateTurnsRemaining > 0 ? 'attack' : 'utility';
  }

  return 'attack';
}

function runBattle(aName, bName, seed) {
  const random = rng(seed);
  const a = createFighter(aName);
  const b = createFighter(bName);
  let turn = 1;

  while (a.hp > 0 && b.hp > 0 && turn <= MAX_TURNS) {
    for (const [fighter, enemy] of [[a, b], [b, a]]) {
      beginTurn(fighter);

      while (fighter.actionsThisTurn > 0 && fighter.hp > 0 && enemy.hp > 0) {
        const action = chooseAction(fighter, enemy);
        let success;

        if (action === 'special') success = ultimate(fighter, enemy, random);
        else if (action === 'utility') success = utility(fighter, enemy, random);
        else success = true, attack(fighter, enemy, random);

        if (!success) attack(fighter, enemy, random);
        fighter.actionsThisTurn--;
      }

      if (a.hp <= 0 || b.hp <= 0) break;
    }

    if (a.hp > 0 && b.hp > 0 && turn % 3 === 0) {
      a.hp = Math.min(2000, a.hp + 300);
      b.hp = Math.min(2000, b.hp + 300);
    }

    if (a.lightUltimateTurnsRemaining > 0) a.lightUltimateTurnsRemaining--;
    if (b.lightUltimateTurnsRemaining > 0) b.lightUltimateTurnsRemaining--;

    turn++;
  }

  const winner = a.hp > 0 && b.hp <= 0 ? aName
    : b.hp > 0 && a.hp <= 0 ? bName
    : 'Draw';

  return { winner, turns: turn - 1, hpRemaining: Math.max(a.hp, b.hp) };
}

const results = [];
const totals = Object.fromEntries(BLADES.map(blade => [blade, { wins: 0, losses: 0, draws: 0 }]));

for (let repeat = 1; repeat <= REPEATS; repeat++) {
  for (let i = 0; i < BLADES.length; i++) {
    for (let j = i + 1; j < BLADES.length; j++) {
      const a = BLADES[i];
      const b = BLADES[j];
      const result = runBattle(a, b, repeat * 1000 + i * 100 + j);
      results.push({ repeat, matchup: \`${a} vs ${b}\`, ...result });

      if (result.winner === a) {
        totals[a].wins++;
        totals[b].losses++;
      } else if (result.winner === b) {
        totals[b].wins++;
        totals[a].losses++;
      } else {
        totals[a].draws++;
        totals[b].draws++;
      }
    }
  }
}

console.table(results);
console.table(
  Object.entries(totals)
    .map(([blade, stats]) => ({
      blade,
      ...stats,
      winRate: \`${((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100).toFixed(1)}%\`
    }))
    .sort((a, b) => b.wins - a.wins)
);

console.log(\`Ran ${results.length} battles: ${REPEATS} repeats × 6 unique matchups.\`);
