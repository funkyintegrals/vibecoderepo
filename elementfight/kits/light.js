export const LightKit = {

  name: 'Light',

  attackName: 'Radiant Strike',
  utilityName: 'Halo Guard',
  specialName: 'Solar Judgment',

  attackDamage: 175,

  ultimateDamage: 1100,

  focusCap: 10,


  /*
   * Light's normal attack.
   */

  attack() {

    return {
      rawDamage: this.attackDamage,
      critical: false
    };

  },


  /*
   * Halo Guard.
   *
   * The fighter takes half damage from the next
   * incoming hit, using the shared combat defense
   * mechanic.
   */

  utility(fighter) {

    if (fighter.isDefending) {

      return {
        success: false,
        message:
          'Halo Guard is already active.'
      };

    }

    fighter.isDefending = true;

    return {
      success: true,
      message:
        'Halo Guard — incoming damage is reduced by 50% until hit.'
    };

  },


  /*
   * Solar Judgment.
   */

  ultimate() {

    return {
      rawDamage: this.ultimateDamage,
      critical: false
    };

  }

};
