export const ElectricityKit = {

  name: 'Electricity',

  attackName: 'Volt Arc',
  utilityName: 'Static Impulse',
  specialName: 'Thunderstorm',

  attackDamage: 125,

  criticalDamage: 500,

  criticalChance: 0.18,

  guaranteedCritAttacks: 3,

  ultimateDamage: 1600,

  focusCap: 8,


  /*
   * Electricity normal attack.
   */

  attack(fighter) {

    let critical = false;

    if (fighter.increasedCrits > 0) {

      critical = Math.random() < Math.min(1, this.criticalChance + 0.5);

      fighter.increasedCrits -= 1;

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

    if (fighter.increasedCrits > 0) {

      return {
        success: false,

        message:
          'Static Impulse is already active.'
      };
    }

    fighter.increasedCrits =
      this.guaranteedCritAttacks;

    return {
      success: true,

      message:
        `Static Impulse — next ${this.guaranteedCritAttacks} attacks have critical chance increased by 50 percentage points.`
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
