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

    let finalDamage =
      Math.max(
        1,
        damage - defender.def
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
    critical = false
  ) {

    const damage =
      this.applyDefense(
        rawDamage,
        defender
      );


    defender.hp =
      clamp(
        defender.hp - damage,
        0,
        MAX_HP
      );


    this.ui.addDamageNumber(
      defender === this.state.player
        ? 'player'
        : 'enemy',

      damage,

      critical
    );


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


    const name =
      this.getName(attacker);


    const criticalText =
      result.critical
        ? ' CRITICAL!'
        : '';


    this.addLog(
      `${name} — ${kit.attackName} deals ${damage} damage.${criticalText}`
    );


    this.gainFocus(
      attacker
    );


    return damage;

  }


  utility(fighter) {

    const kit =
      this.getKit(fighter.blade);


    const result =
      kit.utility(fighter);


    if (!result.success) {

      this.addLog(
        `${this.getName(fighter)} — ${result.message}`
      );

      return false;

    }


    this.addLog(
      `${this.getName(fighter)} — ${result.message}`
    );


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

  performTimeDilationHit(
    attacker,
    defender
  ) {

    const kit =
      this.getKit('Time');


    const result =
      kit.rollDilationHit();


    const damage =
      this.dealDamage(
        attacker,
        defender,
        result.rawDamage,
        result.critical
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


      const damage =
        this.applyDefense(
          result.rawDamage,
          defender
        );


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
