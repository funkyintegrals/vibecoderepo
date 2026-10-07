export const LightKit = {
  name: 'Light',
  attackName: 'Radiant Strike',
  utilityName: 'Enlighten',
  specialName: 'Shimmer',
  attackDamage: 200,
  attackHeal: 200,
  utilityCost: 500,
  utilityDamage: 550,
  ultimateTurns: 5,
  focusCap: 10,

  attack() {
    return { rawDamage: this.attackDamage, critical: false };
  },

  utility(fighter) {
    fighter.hp = Math.max(1, fighter.hp - this.utilityCost);
    return {
      success: true,
      rawDamage: this.utilityDamage,
      critical: false,
      message: 'Enlighten — uses 500 HP to deal 550 damage.'
    };
  },

  ultimate() {
    return { turns: this.ultimateTurns };
  }
};
