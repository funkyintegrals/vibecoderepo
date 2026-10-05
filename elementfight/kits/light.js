export const LightKit = {
  name: 'Light',
  attackName: 'Radiant Strike',
  utilityName: 'Enlighten',
  specialName: 'Enlighten',
  attackDamage: 250,
  attackHeal: 150,
  utilityCost: 400,
  utilityDamage: 700,
  ultimateTurns: 3,
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
      message: 'Enlighten — uses 400 HP to deal 700 damage.'
    };
  },

  ultimate() {
    return { turns: this.ultimateTurns };
  }
};
