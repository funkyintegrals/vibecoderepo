export const ElectricityKit = {

  name: 'Electricity',

  attackName: 'Volt Arc',
  utilityName: 'Static Impulse',
  specialName: 'Thunderstorm',

  attackDamage: 150,

  criticalDamage: 300,

  criticalChance: 0.25,

  guaranteedCritAttacks: 3,

  ultimateDamage: 900,

  focusCap: 10,


  /*
   * Electricity normal attack.
   */

  attack(fighter) {

    let critical = false;

    if (fighter.guaranteedCrits > 0) {

      critical = Math.random() < 0.75;

      fighter.guaranteedCrits -= 1;

    } else {

      critical =
        Math.random() <
        this.criticalChance;
    }

    return {
      rawDamage:
        critical
          ? this.criticalDamage
          : this.attackDamage,

      critical
    };
  },


  /*
   * Static Impulse.
   */

  utility(fighter) {

    if (fighter.guaranteedCrits > 0) {

      return {
        success: false,

        message:
          'Static Impulse is already active.'
      };
    }

    fighter.guaranteedCrits =
      this.guaranteedCritAttacks;

    return {
      success: true,

      message:
        `Static Impulse — next ${this.guaranteedCritAttacks} attacks have 50% increased chance of critical hits.`
    };
  },


  /*
   * Thunderstorm.
   */

  ultimate() {

    return {
      rawDamage: this.ultimateDamage,
      critical: false
    };
  }

};
