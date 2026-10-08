function attackerHasLightBuff(fighter) {
  return fighter?.blade === 'Light' && fighter.lightUltimateTurnsRemaining > 0;
}

function defenderHasLightBuff(fighter) {
  return fighter?.blade === 'Light' && fighter.lightUltimateTurnsRemaining > 0;
}

import {
  MAX_HP,
  MAX_FOCUS
} from './state.js';

import {
  clamp
} from './utils.js';


export class Combat {

  constructor(state, getKit, ui) {

    this.state = state;

    this.getKit = getKit;

    this.ui = ui;

  }


  getName(fighter) {

    return fighter === this.state.player
      ? 'Player'
      : 'Enemy';

  }


  gainFocus(
    fighter,
    amount = 1
  ) {

    const kit =
      this.getKit(fighter.blade);

    fighter.focus =
      clamp(
        fighter.focus + amount,
        0,
        kit.focusCap
      );

  }


  applyDefense(
    damage,
    defender
  ) {

    const effectiveDefense =
      defender.blade === 'Flash' &&
      defender.flashDefenseTurnsRemaining > 0
        ? defender.def * 4
        : defender.def;

    let finalDamage =
      Math.max(
        1,
        damage - effectiveDefense
      );


    if (defender.isDefending) {

      finalDamage =
        Math.max(
          1,
          Math.floor(
            finalDamage * 0.5
          )
        );

    }


    return finalDamage;

  }


  dealDamage(
    attacker,
    defender,
    rawDamage,
    critical = false,
    showDamage = true
  ) {

    let damage =
      this.applyDefense(
        rawDamage,
        defender
      );


    if (attackerHasLightBuff(attacker)) {
      damage = Math.max(1, Math.floor(damage * 1.3));
    }


    if (defenderHasLightBuff(defender)) {
      damage = Math.max(1, Math.floor(damage * 0.7));
    }


    defender.hp =
      clamp(
        defender.hp - damage,
        0,
        MAX_HP
      );


    if (showDamage) {
      this.ui.addDamageNumber(
        defender === this.state.player
          ? 'player'
          : 'enemy',

        damage,

        critical
      );
    }


    defender.isDefending =
      false;


    return damage;

  }


  normalAttack(
    attacker,
    defender
  ) {

    const kit =
      this.getKit(attacker.blade);


    const result =
      kit.attack(attacker);


    const damage =
      this.dealDamage(
        attacker,
        defender,
        result.rawDamage,
        result.critical
      );


    if (attacker.blade === 'Light') {
      attacker.hp = clamp(attacker.hp + this.getKit('Light').attackHeal, 0, MAX_HP);
    }


    const name =
      this.getName(attacker);


    const criticalText =
      result.critical
        ? ' CRITICAL!'
        : '';


    this.addLog(
      `${name} — ${kit.attackName} deals ${damage} damage.${criticalText}`
    );


    if (attacker.blade === 'Flash') {
      attacker.flashAttackStacks += 1;
    }


    this.gainFocus(
      attacker
    );


    return damage;

  }


  utility(fighter, defender) {

    const kit =
      this.getKit(fighter.blade);


    const result =
      kit.utility(fighter, defender, this);


    if (!result.success) {

      this.addLog(
        `${this.getName(fighter)} — ${result.message}`
      );

      return false;

    }


    if (result.selfDamage > 0) {
      this.ui.addDamageNumber(
        fighter === this.state.player
          ? 'player'
          : 'enemy',
        result.selfDamage,
        false
      );
    }

    if (result.rawDamage !== undefined && defender) {
      const damage = this.dealDamage(
        fighter,
        defender,
        result.rawDamage,
        result.critical
      );

      this.addLog(
        `${this.getName(fighter)} — ${result.message} ${damage} damage dealt.`
      );
    } else {
      this.addLog(
        `${this.getName(fighter)} — ${result.message}`
      );
    }


    if (fighter.blade === 'Flash') {
      fighter.flashAttackStacks += 1;
    }

    this.gainFocus(
      fighter
    );


    return true;

  }


  ultimate(
    attacker,
    defender
  ) {

    const kit =
      this.getKit(attacker.blade);


    if (
      attacker.focus <
      kit.focusCap
    ) {

      this.addLog(
        `${this.getName(attacker)} — not enough Focus.`
      );

      return false;

    }


    /*
     * Time is handled by the Game class because
     * it is a multi-step Ultimate.
     */

    if (
      attacker.blade === 'Time'
    ) {

      return 'time-dilation';

    }


    if (attacker.blade === 'Light') {
      attacker.focus = 0;
      attacker.lightUltimateTurnsRemaining = kit.ultimate().turns;
      this.addLog(
        `${this.getName(attacker)} — Shimmer activated for ${attacker.lightUltimateTurnsRemaining} turns.`
      );
      return true;
    }


    if (attacker.blade === 'Flash') {
      attacker.focus = 0;
      const result = kit.ultimate();
      attacker.flashAttackStacks += result.stacks;
      this.addLog(
        `${this.getName(attacker)} — Flash Burst grants ${result.stacks} Momentum stacks. Flash is now at ${attacker.flashAttackStacks} stacks.`
      );
      return true;
    }


    /*
     * All other kits can resolve immediately.
     */

    attacker.focus = 0;


    const result =
      kit.ultimate();


    const damage =
      this.dealDamage(
        attacker,
        defender,
        result.rawDamage,
        result.critical
      );


    this.addLog(
      `${this.getName(attacker)} — ${kit.specialName} deals ${damage} damage.`
    );


    return true;

  }


  /*
   * Perform ONE Time Dilation hit.
   *
   * This function is deliberately reusable by both
   * player and enemy.
   */

  rollTimeDilationHit() {

    return this.getKit(
      'Time'
    ).rollDilationHit();

  }


  performTimeDilationHit(
    attacker,
    defender,
    hit = null,
    options = {}
  ) {

    const result =
      hit || this.rollTimeDilationHit();

    const damage =
      this.dealDamage(
        attacker,
        defender,
        result.rawDamage,
        result.critical,
        options.showDamage !== false
      );

    return {
      damage,
      critical: result.critical
    };

  }


  /*
   * Enemy Time Ultimate.
   *
   * Mechanically it still performs 10 separate hits.
   *
   * But instead of showing 10 separate damage numbers,
   * we suppress the individual UI numbers and display
   * the total at the end.
   */

  performEnemyTimeUltimate(
    attacker,
    defender
  ) {

    const kit =
      this.getKit('Time');


    const hitCount =
      kit.ultimate.hits;


    let totalDamage = 0;

    let criticalHits = 0;


    for (
      let i = 0;
      i < hitCount;
      i++
    ) {

      const result =
        kit.rollDilationHit();


      let damage =
        this.applyDefense(
          result.rawDamage,
          defender
        );


      if (defenderHasLightBuff(defender)) {
        damage = Math.max(1, Math.floor(damage * 0.7));
      }


      defender.hp =
        clamp(
          defender.hp - damage,
          0,
          MAX_HP
        );


      defender.isDefending =
        false;


      totalDamage +=
        damage;


      if (
        result.critical
      ) {

        criticalHits++;

      }

    }


    /*
     * One combined damage number.
     */

    this.ui.addDamageNumber(
      defender === this.state.player
        ? 'player'
        : 'enemy',

      totalDamage,

      criticalHits > 0
    );


    this.addLog(
      `Enemy — Age of Stillness deals ${totalDamage} total damage across ${hitCount} Dilations (${criticalHits} critical).`
    );


    return {
      totalDamage,
      criticalHits
    };

  }


  addLog(message) {

    this.state.log.unshift(
      message
    );


    if (
      this.state.log.length > 2
    ) {

      this.state.log.length = 2;

    }


    this.ui.renderLog(
      this.state.log
    );

  }

}
