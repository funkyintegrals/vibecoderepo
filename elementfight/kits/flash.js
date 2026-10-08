export const FlashKit = {

  name: 'Flash',

  attackName: 'Flash Strike',
  utilityName: 'Flash Guard',
  specialName: 'Flash Burst',

  attackDamage: 10,

  focusCap: 5,

  attackMultiplierPerStack: 1.229,
  ultimateStacks: 2,


  attack(fighter) {

    return {
      rawDamage:
        Math.floor(
          this.attackDamage *
          Math.pow(
            this.attackMultiplierPerStack,
            fighter.flashAttackStacks
          )
        ),
      critical: false
    };

  },


  utility(fighter) {

    fighter.flashDefenseTurnsRemaining = 2;

    return {
      success: true,
      message:
        'Flash Guard — defense is multiplied by 2 for 2 turns.'
    };

  },


  ultimate() {

    return {
      stacks: this.ultimateStacks
    };

  }

};
