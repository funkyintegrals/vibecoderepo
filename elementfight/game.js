import {
  createFighter
} from './state.js';

import {
  getKit,
  getRandomBlade
} from './kits/index.js';

import {
  clamp,
  delay
} from './utils.js';


export class Game {

  constructor(ui, combat) {

    this.ui = ui;

    this.combat = combat;

    this.state =
      this.combat.state;

  }


  reset() {

    this.state.player =
      createFighter('Time');


    this.state.enemy =
      createFighter(
        getRandomBlade()
      );


    this.state.turn = 1;

    this.state.phase =
      'player';

    this.state.isBattleOver =
      false;

    this.state.log = [];


    this.addLog(
      `Enemy — chose ${this.state.enemy.blade} blade.`
    );


    this.addLog(
      'Battle — A new blade duel begins.'
    );


    this.beginTurn(
      this.state.player
    );


    this.setStatus(
      'Choose your blade and move.'
    );


    this.update();

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


  setStatus(message) {

    this.ui.setStatus(
      message
    );

  }


  beginTurn(fighter) {

    fighter.isDefending =
      false;


    if (
      fighter.timeDoubleTurnPending
    ) {

      fighter.timeDoubleTurnPending =
        false;

      fighter.timeDoubleTurnActive =
        true;

      fighter.actionsThisTurn =
        2;


      this.addLog(
        `${this.combat.getName(fighter)} — Time double turn activated.`
      );

      return;

    }


    if (
      fighter.timeDoubleTurnActive
    ) {

      fighter.timeDoubleTurnActive =
        false;

    }


    fighter.actionsThisTurn =
      1;

  }


  endAction(fighter) {

    fighter.actionsThisTurn =
      Math.max(
        0,
        fighter.actionsThisTurn - 1
      );

  }


  checkBattleOver() {

    const {
      player,
      enemy
    } = this.state;


    if (
      enemy.hp <= 0
    ) {

      enemy.hp = 0;

      this.state.isBattleOver =
        true;

      this.state.phase =
        'over';


      player.timeUltimateActive =
        false;


      this.setStatus(
        'Victory! The enemy blade is broken.'
      );


      this.addLog(
        'Battle — You won the battle.'
      );


      this.update();

      return true;

    }


    if (
      player.hp <= 0
    ) {

      player.hp = 0;

      this.state.isBattleOver =
        true;

      this.state.phase =
        'over';


      player.timeUltimateActive =
        false;


      this.setStatus(
        'Defeat. Press New Battle to try again.'
      );


      this.addLog(
        'Battle — You lost the battle.'
      );


      this.update();

      return true;

    }


    return false;

  }


  healEveryThreeTurns() {

    if (
      this.state.turn % 3 !== 0
    ) {

      return;

    }


    const healAmount = 300;


    for (
      const [name, fighter]
      of [
        ['Player', this.state.player],
        ['Enemy', this.state.enemy]
      ]
    ) {

      const oldHp =
        fighter.hp;


      fighter.hp =
        clamp(
          fighter.hp + healAmount,
          0,
          1000
        );


      const healed =
        fighter.hp - oldHp;


      if (
        healed > 0
      ) {

        this.addLog(
          `${name} — healed ${healed} HP.`
        );

      }

    }

  }


  async playerAction(action) {

    if (
      this.state.isBattleOver ||
      this.state.phase !== 'player'
    ) {

      return;

    }


    const player =
      this.state.player;

    const enemy =
      this.state.enemy;


    /*
     * Time Dilation.
     */

    if (
      player.timeUltimateActive
    ) {

      if (
        action === 'dilate'
      ) {

        this.playerDilate();

      }

      return;

    }


    /*
     * Utility restrictions.
     */

    if (
      action === 'utility' &&
      player.blade === 'Time' &&
      player.timeDoubleTurnActive
    ) {

      this.setStatus(
        'Time Utility is disabled during the double turn.'
      );

      return;

    }


    if (
      action === 'utility' &&
      player.blade === 'Electricity' &&
      player.guaranteedCrits > 0
    ) {

      this.setStatus(
        'Electricity Utility is already active.'
      );

      return;

    }


    /*
     * Ultimate.
     */

    if (
      action === 'special'
    ) {

      const result =
        this.combat.ultimate(
          player,
          enemy
        );


      if (
        result === 'time-dilation'
      ) {

        this.startPlayerTimeUltimate();

        return;

      }


      if (!result) {

        this.update();

        return;

      }

    }


    else if (
      action === 'attack'
    ) {

      this.combat.normalAttack(
        player,
        enemy
      );

    }


    else if (
      action === 'utility'
    ) {

      const success =
        this.combat.utility(
          player
        );


      if (!success) {

        this.update();

        return;

      }

    }


    this.endAction(
      player
    );


    if (
      this.checkBattleOver()
    ) {

      return;

    }


    if (
      player.actionsThisTurn > 0
    ) {

      this.setStatus(
        'Extra action available. Choose your next move.'
      );


      this.update();

      return;

    }


    await this.enemyTurn();

  }


  /*
   * Player Time Ultimate.
   */

  startPlayerTimeUltimate() {

    const player =
      this.state.player;


    player.focus = 0;

    player.timeUltimateActive =
      true;

    player.timeUltimateHitsRemaining =
      getKit('Time').ultimate.hits;


    this.setStatus(
      'Dilation active. Press Dilate to strike.'
    );


    this.addLog(
      'Player — Age of Stillness begins.'
    );


    this.update();

  }


  playerDilate() {

    const player =
      this.state.player;

    const enemy =
      this.state.enemy;


    const result =
      this.combat.performTimeDilationHit(
        player,
        enemy
      );


    player.timeUltimateHitsRemaining--;


    const hitNumber =
      10 -
      player.timeUltimateHitsRemaining;


    const critText =
      result.critical
        ? ' CRITICAL!'
        : '';


    this.addLog(
      `Player — Dilate ${hitNumber}/10 deals ${result.damage} damage.${critText}`
    );


    if (
      this.checkBattleOver()
    ) {

      return;

    }


    if (
      player.timeUltimateHitsRemaining <= 0
    ) {

      player.timeUltimateActive =
        false;


      this.addLog(
        'Player — Age of Stillness ends.'
      );


      this.setStatus(
        'Dilation complete.'
      );


      this.update();


      this.enemyTurn();

      return;

    }


    this.setStatus(
      `Dilation active — ${player.timeUltimateHitsRemaining} hits remaining.`
    );


    this.update();

  }


  chooseEnemyAction() {

    const enemy =
      this.state.enemy;

    const kit =
      getKit(enemy.blade);


    /*
     * Ultimate has priority.
     */

    if (
      enemy.focus >=
      kit.focusCap
    ) {

      return 'special';

    }


    /*
     * Double turn attacks twice.
     */

    if (
      enemy.actionsThisTurn > 1
    ) {

      return 'attack';

    }


    /*
     * Time AI.
     */

    if (
      enemy.blade === 'Time'
    ) {

      if (
        enemy.timeDoubleTurnPending ||
        enemy.timeDoubleTurnActive
      ) {

        return 'attack';

      }


      return 'utility';

    }


    /*
     * Electricity AI.
     */

    if (
      enemy.blade === 'Electricity'
    ) {

      if (
        enemy.guaranteedCrits > 0
      ) {

        return 'attack';

      }


      return 'utility';

    }


    return 'attack';

  }


  async enemyTurn() {

    if (
      this.state.isBattleOver
    ) {

      return;

    }


    this.state.phase =
      'enemy';


    const enemy =
      this.state.enemy;


    const player =
      this.state.player;


    this.beginTurn(
      enemy
    );


    this.update();


    await delay(500);


    /*
     * Time Ultimate is special because the enemy's
     * 10 Dilation hits happen automatically.
     */

    if (
      enemy.blade === 'Time' &&
      enemy.focus >=
        getKit('Time').focusCap
    ) {

      enemy.focus = 0;


      this.setStatus(
        'Enemy uses Age of Stillness...'
      );


      this.update();


      await delay(500);


      this.combat.performEnemyTimeUltimate(
        enemy,
        player
      );


      if (
        this.checkBattleOver()
      ) {

        return;

      }


      await delay(500);


      this.finishEnemyTurn();

      return;

    }


    /*
     * Normal enemy actions.
     */

    while (
      enemy.actionsThisTurn > 0 &&
      !this.state.isBattleOver
    ) {

      const action =
        this.chooseEnemyAction();


      let success = true;


      if (
        action === 'special'
      ) {

        const result =
          this.combat.ultimate(
            enemy,
            player
          );


        /*
         * Time was handled above, so this is
         * Electricity here.
         */

        success =
          result === true;

      }


      else if (
        action === 'attack'
      ) {

        this.combat.normalAttack(
          enemy,
          player
        );

      }


      else if (
        action === 'utility'
      ) {

        success =
          this.combat.utility(
            enemy
          );

      }


      if (!success) {

        this.combat.normalAttack(
          enemy,
          player
        );

      }


      this.endAction(
        enemy
      );


      this.update();


      if (
        this.checkBattleOver()
      ) {

        return;

      }


      if (
        enemy.actionsThisTurn > 0
      ) {

        this.setStatus(
          'Enemy has an extra action.'
        );


        await delay(500);

      }

    }


    this.finishEnemyTurn();

  }


  finishEnemyTurn() {

    this.state.turn++;

    this.healEveryThreeTurns();


    this.state.phase =
      'player';


    this.beginTurn(
      this.state.player
    );


    this.setStatus(
      `Turn ${this.state.turn} begins. Choose your move.`
    );


    this.update();

  }


  switchBlade(newBlade) {

    const player =
      this.state.player;


    if (
      this.state.isBattleOver ||
      this.state.phase !== 'player' ||
      player.timeUltimateActive
    ) {

      return;

    }


    if (
      newBlade === player.blade
    ) {

      return;

    }


    const oldBlade =
      player.blade;


    /*
     * Clear temporary kit effects.
     */

    player.guaranteedCrits =
      0;

    player.timeDoubleTurnPending =
      false;

    player.timeDoubleTurnActive =
      false;

    player.isDefending =
      false;


    player.blade =
      newBlade;


    this.addLog(
      `Player — switched from ${oldBlade} to ${newBlade}.`
    );


    this.setStatus(
      `${newBlade} selected. Choose your action.`
    );


    this.update();

  }


  update() {

    this.ui.render(
      this.state,
      getKit
    );


    if (
      this.state.player.timeUltimateActive
    ) {

      this.ui.showDilationControls(
        this.state.player.timeUltimateHitsRemaining,

        () => this.playerAction('dilate')
      );

    } else {

      this.ui.showNormalControls(
        this.state,
        getKit,

        action =>
          this.playerAction(action)
      );

    }


    this.ui.updateBladeButtons(
      this.state,

      blade =>
        this.switchBlade(blade)
    );

  }

}
