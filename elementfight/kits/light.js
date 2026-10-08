export const LightKit = {
  name: 'Light',
  attackName: 'Radiant Strike',
  utilityName: 'Enlighten',
  specialName: 'Shimmer',
  attackDamage: 185,
  attackHeal: 150,
  utilityCost: 300,
  utilityDamage: 700,
  ultimateTurns: 5,
  focusCap: 6,

  attack() {
    return { rawDamage: this.attackDamage, critical: false };
  },

  utility(fighter) {
    const hpBefore = fighter.hp;
    const selfDamage = Math.min(
      this.utilityCost,
      Math.max(0, hpBefore - 1)
    );

    fighter.hp = Math.max(1, hpBefore - selfDamage);

    return {
      success: true,
      rawDamage: this.utilityDamage,
      selfDamage,
      critical: false,
      message: `Enlighten — consumes ${selfDamage} HP to deal ${this.utilityDamage} damage.`
    };
  },

  ultimate() {
    return { turns: this.ultimateTurns };
  }
};
