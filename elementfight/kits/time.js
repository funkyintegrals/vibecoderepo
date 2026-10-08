export const TimeKit = {

  name: 'Time',

  attackName: 'Chrono Slash',
  utilityName: 'Temporal Guard',
  specialName: 'Age of Stillness',

  attackDamage: 150,

  ultimate: {
    hits: 25,

    normalDamage: 100,

    criticalDamage: 180,

    criticalChance: 0.7
  },

  focusCap: 15,


  /*
   * Time's normal attack.
   */

  attack() {
    return {
      rawDamage: this.attackDamage,
      critical: false
    };
  },


  /*
   * Time Utility.
   *
   * The generic combat engine will apply the actual
   * defense / double-turn state.
   */

  utility(fighter) {

    if (
      fighter.timeDoubleTurnPending ||
      fighter.timeDoubleTurnActive
    ) {
      return {
        success: false,
        message:
          'Temporal Guard is already active.'
      };
    }

    fighter.timeDoubleTurnPending = true;

    return {
      success: true,

      message:
        'Temporal Guard — next turn is a double turn.'
    };
  },


  /*
   * Roll one individual Dilation hit.
   *
   * This is deliberately a separate function.
   *
   * That means the game can use exactly the same
   * mechanics for both:
   *
   *   Player manual Dilation
   *   Enemy automatic Dilation
   */

  rollDilationHit(hitNumber = 1) {

    const critical =
      Math.random() <
      this.ultimate.criticalChance;

    const jackpot =
      Math.random() < 0.12;

    return {
      rawDamage:
        (critical
          ? this.ultimate.criticalDamage
          : this.ultimate.normalDamage) *
        (jackpot ? 2 : 1),

      critical,
      jackpot,
      defensePiercing: hitNumber % 5 === 0
    };
  }

};
