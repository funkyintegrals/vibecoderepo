export const MAX_HP = 5000;
export const BASE_DEFENSE = 50;
export const MAX_FOCUS = 12;


export function createFighter(blade) {

  return {

    hp: MAX_HP,

    def: BASE_DEFENSE,

    focus: 0,

    blade,

    isDefending: false,

    actionsThisTurn: 1,

    timeDoubleTurnPending: false,

    timeDoubleTurnActive: false,

    increasedCrits: 0,

    timeUltimateActive: false,

    timeUltimateHitsRemaining: 0,

    lightUltimateTurnsRemaining: 0,

    flashAttackStacks: 0,
    flashDefenseTurnsRemaining: 0

  };
}


export function createGameState(blade) {

  return {

    player:
      createFighter(blade),

    enemy:
      createFighter(blade),

    turn: 1,

    phase: 'player',

    isBattleOver: false,

    log: []

  };
}
