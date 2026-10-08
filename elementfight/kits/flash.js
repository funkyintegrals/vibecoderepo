export const FlashKit = {

  name: 'Flash',

  attackName: 'Flash Strike',
  utilityName: 'Flash Guard',
  specialName: 'Flash Burst',

  attackDamage: 20,

  focusCap: 5,

  attackMultiplierPerStack: 1.20,
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

    fighter.flashDefenseTurnsRemaining = 1;

    return {
      success: true,
      message:
        'Flash Guard — defense is multiplied by 2 for 1 turn.'
    };

  },


  ultimate() {

    return {
      stacks: this.ultimateStacks
    };

  }

};
