import {
  createFighter,
  MAX_HP
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

    this.mode = 'ai';
    this.activeSide = 'player';
    this.pvpSelectionStep = 1;
    this.timeUltimateSide = 'player';

  }


  reset(mode = this.mode || 'ai') {

    this.mode = mode === 'pvp' ? 'pvp' : 'ai';
    this.activeSide = 'player';
    this.pvpSelectionStep = 1;
    this.timeUltimateSide = 'player';

    this.ui.clearTimeStopEffects();
    this.state.bladeSelectionLocked = false;
    this.ui.setBladeButtonsLocked(false);
    this.timeUltimateTotalDamage = 0;
    this.timeUltimateCriticalHits = 0;
    this.timeUltimateResolving = false;
    this.timeUltimateActionBusy = false;

    this.state.player = createFighter(null);
    this.state.enemy = createFighter(
      this.mode === 'pvp' ? null : getRandomBlade()
    );

    this.state.mode = this.mode;
    this.state.activeSide = this.activeSide;
    this.state.selectionStep = this.pvpSelectionStep;
    this.state.turn = 1;
    this.state.phase = 'selecting';
    this.state.isBattleOver = false;
    this.state.log = [];

    if (this.mode === 'pvp') {
      this.addLog('Local PvP — Player 1, choose your blade.');
      this.setStatus('Local PvP selected. Player 1, choose your blade.');
    } else {
      this.addLog(`Enemy — chose ${this.state.enemy.blade} blade.`);
      this.addLog('Battle — A new blade duel begins.');
      this.setStatus('Choose your blade and move.');
    }

    this.update();

  }

  addLog(message) {

    this.state.log.unshift(
      message
    );


    if (
      this.state.log.length > 3
    ) {

      this.state.log.length = 3;

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

    if (fighter.flashDefenseTurnsRemaining > 0) {
      fighter.flashDefenseTurnsRemaining -= 1;
    }


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


      if (this.mode === 'pvp') {
        this.setStatus('Player 1 wins! Player 2\'s blade is broken.');
        this.addLog('Battle — Player 1 wins.');
      } else {
        this.setStatus('Victory! The enemy blade is broken.');
        this.addLog('Battle — You won the battle.');
      }


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


      if (this.mode === 'pvp') {
        this.setStatus('Player 2 wins! Player 1\'s blade is broken.');
        this.addLog('Battle — Player 2 wins.');
      } else {
        this.setStatus('Defeat. Press New Battle to try again.');
        this.addLog('Battle — You lost the battle.');
      }


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
          MAX_HP
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

    const localPvp = this.mode === 'pvp';
    const side = localPvp ? this.activeSide : 'player';

    if (
      this.state.isBattleOver ||
      (localPvp && this.state.phase !== side) ||
      (!localPvp && this.state.phase !== 'player')
    ) {
      return;
    }

    const player = this.state[side];
    const enemySide = side === 'player' ? 'enemy' : 'player';
    const enemy = this.state[enemySide];

    if (player.timeUltimateActive) {
      if (action === 'dilate') {
        await this.playerDilate(side);
      }
      return;
    }

    if (
      action === 'utility' &&
      player.blade === 'Time' &&
      player.timeDoubleTurnActive
    ) {
      this.setStatus('Time Utility is disabled during the double turn.');
      return;
    }

    if (
      action === 'utility' &&
      player.blade === 'Electricity' &&
      player.increasedCrits > 0
    ) {
      this.setStatus('Electricity Utility is already active.');
      return;
    }

    if (action === 'special') {
      if (
        player.focus >= getKit(player.blade).focusCap &&
        player.blade !== 'Time'
      ) {
        await this.ui.playUltimateAnimation(
          player.blade,
          side,
          enemySide
        );
      }

      const result = this.combat.ultimate(player, enemy);

      if (result === 'time-dilation') {
        this.state.bladeSelectionLocked = true;
        this.ui.setBladeButtonsLocked(true);
        this.startPlayerTimeUltimate(side);
        return;
      }

      if (!result) {
        this.update();
        return;
      }
    } else if (action === 'attack') {
      this.combat.normalAttack(player, enemy);
    } else if (action === 'utility') {
      const success = this.combat.utility(player, enemy);

      if (!success) {
        this.update();
        return;
      }
    } else {
      return;
    }

    this.endAction(player);
    this.state.bladeSelectionLocked = true;
    this.ui.setBladeButtonsLocked(true);

    if (this.checkBattleOver()) {
      return;
    }

    if (player.actionsThisTurn > 0) {
      this.setStatus(
        localPvp
          ? `${this.combat.getName(player)} has an extra action. Choose the next move.`
          : 'Extra action available. Choose your next move.'
      );
      this.update();
      return;
    }

    if (localPvp) {
      this.finishPvpTurn(side);
      return;
    }

    await this.enemyTurn();

  }

  /*
   * Player Time Ultimate.
   */

  async startPlayerTimeUltimate(side = 'player') {

    const attackerSide = side;
    const defenderSide = side === 'player' ? 'enemy' : 'player';
    const attacker = this.state[attackerSide];

    this.timeUltimateSide = attackerSide;
    attacker.focus = 0;
    attacker.timeUltimateActive = true;
    attacker.timeUltimateHitsRemaining = getKit('Time').ultimate.hits;

    this.timeUltimateTotalDamage = 0;
    this.timeUltimateCriticalHits = 0;
    this.timeUltimateResolving = false;

    this.setStatus(`${this.combat.getName(attacker)} is stopping time...`);

    await this.ui.playUltimateAnimation(
      'Time',
      attackerSide,
      defenderSide,
      {
        timeStop: true,
        timeHits: getKit('Time').ultimate.hits
      }
    );

    if (this.state.isBattleOver) {
      return;
    }

    this.setStatus(
      `Time stopped. ${this.combat.getName(attacker)}: press Dilate to release the blades.`
    );
    this.update();

  }


  async playerDilate(side = null) {

    const attackerSide =
      side || this.timeUltimateSide || (this.mode === 'pvp' ? this.activeSide : 'player');
    const defenderSide = attackerSide === 'player' ? 'enemy' : 'player';
    const attacker = this.state[attackerSide];
    const defender = this.state[defenderSide];

    if (
      this.timeUltimateResolving ||
      this.timeUltimateActionBusy ||
      attacker.timeUltimateHitsRemaining <= 0
    ) {
      return;
    }

    this.timeUltimateActionBusy = true;

    const totalHits = getKit('Time').ultimate.hits;

    this.timeUltimateTotalDamage = 0;
    this.timeUltimateCriticalHits = 0;
    this.timeUltimateResolving = true;

    this.setStatus(`Summoning ${totalHits} Dilates...`);
    this.update();

    const defenderPortrait =
      defenderSide === 'player'
        ? this.ui.playerPortrait
        : this.ui.enemyPortrait;

    await Promise.all(
      Array.from(
        { length: totalHits },
        async (_, i) => {
          await delay(i * 50);

          if (this.state.isBattleOver) {
            return;
          }

          attacker.timeUltimateHitsRemaining = Math.max(
            0,
            attacker.timeUltimateHitsRemaining - 1
          );

          await this.ui.playTimeStopSword(
            defenderPortrait,
            i,
            totalHits
          );
        }
      )
    );

    const results = [];

    for (let i = 0; i < totalHits; i++) {
      results.push(this.combat.rollTimeDilationHit(i + 1));
    }

    attacker.timeUltimateHitsRemaining = 0;

    this.setStatus(`Time resumes. Releasing all ${totalHits} Dilates...`);

    await this.ui.playTimeStopRelease(index => {
      const hitResult = this.combat.performTimeDilationHit(
        attacker,
        defender,
        results[index],
        { showDamage: false }
      );

      this.timeUltimateTotalDamage += hitResult.damage;

      if (hitResult.critical) {
        this.timeUltimateCriticalHits++;
      }

      this.ui.showAccumulatedDamage(
        defenderSide,
        this.timeUltimateTotalDamage,
        this.timeUltimateCriticalHits > 0,
        index + 1
      );
    });

    attacker.timeUltimateActive = false;
    this.timeUltimateActionBusy = false;
    this.ui.clearTimeStopEffects();

    this.addLog(
      `${this.combat.getName(attacker)} — Age of Stillness: ${this.timeUltimateCriticalHits} total crits, ${this.timeUltimateTotalDamage} total damage.`
    );

    this.timeUltimateResolving = false;

    const battleOver = this.checkBattleOver();
    this.ui.finishAccumulatedDamage(defenderSide);

    if (battleOver) {
      return;
    }

    this.setStatus('Dilation complete.');
    this.update();

    if (this.mode === 'pvp') {
      this.finishPvpTurn(attackerSide);
    } else {
      await this.enemyTurn();
    }

  }

  getPlayerLethalDamage(enemy, player) {

    const playerKit =
      getKit(player.blade);

    const lightReduction =
      enemy.blade === 'Light' && enemy.lightUltimateTurnsRemaining > 0
        ? 0.7
        : 1;

    const defense =
      enemy.isDefending
        ? 0.5
        : 1;

    const postDefense = rawDamage =>
      Math.max(
        1,
        Math.floor(
          Math.max(1, rawDamage - enemy.def) *
          defense *
          lightReduction
        )
      );

    let lethalDamage =
      postDefense(playerKit.attackDamage);

    if (player.blade === 'Electricity') {
      lethalDamage = Math.max(
        lethalDamage,
        postDefense(playerKit.criticalDamage)
      );
    }

    if (player.blade === 'Time') {
      lethalDamage = Math.max(
        lethalDamage,
        postDefense(playerKit.ultimate.criticalDamage) * playerKit.ultimate.hits
      );
    }

    if (player.blade === 'Light') {
      lethalDamage = Math.max(
        lethalDamage,
        postDefense(playerKit.utilityDamage)
      );
    }

    if (player.blade === 'Flash') {
      lethalDamage = Math.max(
        lethalDamage,
        postDefense(
          playerKit.attackDamage *
          Math.pow(
            playerKit.attackMultiplierPerStack,
            player.flashAttackStacks
          )
        )
      );
    }

    if (player.focus >= playerKit.focusCap) {
      if (player.blade === 'Electricity') {
        lethalDamage = Math.max(
          lethalDamage,
          postDefense(playerKit.ultimateDamage)
        );
      }
    }

    return lethalDamage;

  }


  chooseEnemyAction() {

    const enemy =
      this.state.enemy;

    const player =
      this.state.player;

    const kit =
      getKit(enemy.blade);


    /*
     * Always use a ready Ultimate first.
     */

    if (
      enemy.focus >=
      kit.focusCap
    ) {

      return 'special';

    }


    /*
     * Extra actions should be spent attacking.
     */

    if (
      enemy.actionsThisTurn > 1
    ) {

      return 'attack';

    }


    /*
     * Light AI.
     *
     * Enlighten costs 500 HP, so only use it when
     * Light can remain at 600+ HP afterwards, or
     * when it can finish the player.
     */

    if (
      enemy.blade === 'Light'
    ) {

      if (
        enemy.lightUltimateTurnsRemaining > 0
      ) {

        return 'attack';

      }


      const hpAfterEnlighten =
        enemy.hp -
        kit.utilityCost;

      const damageAfterDefense =
        Math.max(
          1,
          kit.utilityDamage -
          player.def
        );

      const canFinish =
        player.hp <=
        damageAfterDefense;

      const playerLethalDamage =
        this.getPlayerLethalDamage(enemy, player);

      const safeFromLethalHit =
        hpAfterEnlighten > playerLethalDamage;

      const safeToUse =
        hpAfterEnlighten >= 600 &&
        safeFromLethalHit;

      if (
        canFinish ||
        safeToUse
      ) {

        return 'utility';

      }

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
     * Flash AI.
     */

    if (
      enemy.blade === 'Flash'
    ) {

      if (
        enemy.flashDefenseTurnsRemaining > 0
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
        enemy.increasedCrits > 0
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
     * all configured Dilation hits happen automatically.
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

      await this.ui.playUltimateAnimation(
        'Time',
        'enemy',
        'player',
        {
          timeStop: true,
          timeHits:
            getKit('Time').ultimate.hits,
          summonAllSwords: true,
          showStopwatch: false
        }
      );

      const totalHits =
        getKit('Time').ultimate.hits;

      const results = [];

      for (
        let i = 0;
        i < totalHits;
        i++
      ) {
        results.push(
          this.combat.rollTimeDilationHit(i + 1)
        );
      }

      let totalDamage = 0;
      let criticalHits = 0;

      this.setStatus(
        'Time resumes.'
      );

      await this.ui.playTimeStopRelease(
        index => {

          const result =
            this.combat.performTimeDilationHit(
              enemy,
              player,
              results[index],
              {
                showDamage: false
              }
            );

          totalDamage +=
            result.damage;

          if (result.critical) {
            criticalHits++;
          }

          this.ui.showAccumulatedDamage(
            'player',
            totalDamage,
            criticalHits > 0,
            index + 1
          );

        }
      );

      this.ui.clearTimeStopEffects();

      this.addLog(
        `Enemy — Age of Stillness: ${criticalHits} total crits, ${totalDamage} total damage.`
      );

      this.ui.finishAccumulatedDamage(
        'player'
      );

      if (
        this.checkBattleOver()
      ) {
        return;
      }

      await delay(300);

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

        if (
          enemy.focus >= getKit(enemy.blade).focusCap
        ) {

          await this.ui.playUltimateAnimation(
            enemy.blade,
            'enemy',
            'player'
          );

          
        }

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
            enemy,
            player
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


  advanceLightUltimate(fighter) {

    if (fighter.lightUltimateTurnsRemaining <= 0) {
      return;
    }

    fighter.lightUltimateTurnsRemaining--;

    if (fighter.lightUltimateTurnsRemaining === 0) {
      this.addLog(
        `${this.combat.getName(fighter)} — Shimmer effect ends.`
      );
    }

  }


  finishEnemyTurn() {

    this.state.turn++;

    this.healEveryThreeTurns();

    this.advanceLightUltimate(this.state.player);
    this.advanceLightUltimate(this.state.enemy);


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

    if (
      this.state.isBattleOver ||
      (this.state.phase !== 'player' &&
       this.state.phase !== 'selecting') ||
      this.state.player.timeUltimateActive ||
      this.state.enemy.timeUltimateActive ||
      this.state.bladeSelectionLocked
    ) {
      return;
    }

    if (this.mode === 'pvp' && this.state.phase === 'selecting') {
      if (this.pvpSelectionStep === 1) {
        this.state.player.blade = newBlade;
        this.pvpSelectionStep = 2;
        this.state.selectionStep = 2;

        this.addLog(`Player 1 — chose ${newBlade} blade.`);
        this.setStatus(`Pass the device to Player 2. Choose your blade.`);
        this.update();
        return;
      }

      this.state.enemy.blade = newBlade;
      this.pvpSelectionStep = 0;
      this.state.selectionStep = 0;
      this.activeSide = 'player';
      this.state.activeSide = this.activeSide;
      this.state.phase = 'player';
      this.state.bladeSelectionLocked = true;
      this.ui.setBladeButtonsLocked(true);

      this.beginTurn(this.state.player);
      this.addLog(`Player 2 — chose ${newBlade} blade.`);
      this.addLog('Local PvP — Player 1 goes first.');
      this.setStatus('Player 1, choose your move.');
      this.update();
      return;
    }

    const player = this.state.player;

    if (newBlade === player.blade) {
      return;
    }

    const oldBlade = player.blade;

    player.increasedCrits = 0;
    player.lightUltimateTurnsRemaining = 0;
    player.timeDoubleTurnPending = false;
    player.timeDoubleTurnActive = false;
    player.isDefending = false;
    player.flashAttackStacks = 0;
    player.flashDefenseTurnsRemaining = 0;

    const selectingStartingBlade = this.state.phase === 'selecting';
    player.blade = newBlade;

    if (selectingStartingBlade) {
      this.state.phase = 'player';
      this.state.bladeSelectionLocked = true;
      this.ui.setBladeButtonsLocked(true);
    }

    this.addLog(
      oldBlade
        ? `Player — switched from ${oldBlade} to ${newBlade}.`
        : `Player — selected ${newBlade} blade.`
    );

    this.setStatus(`${newBlade} selected. Choose your action.`);
    this.update();

  }

  finishPvpTurn(side) {

    if (this.state.isBattleOver) {
      return;
    }

    if (side === 'player') {
      this.activeSide = 'enemy';
      this.state.activeSide = this.activeSide;
      this.state.phase = 'enemy';
      this.beginTurn(this.state.enemy);
      this.setStatus('Player 2\'s turn — pass the device.');
      this.update();
      return;
    }

    this.state.turn++;
    this.healEveryThreeTurns();
    this.advanceLightUltimate(this.state.player);
    this.advanceLightUltimate(this.state.enemy);

    this.activeSide = 'player';
    this.state.activeSide = this.activeSide;
    this.state.phase = 'player';
    this.beginTurn(this.state.player);

    this.setStatus(`Round ${this.state.turn} — Player 1, choose your move.`);
    this.update();

  }


  update() {

    this.state.mode = this.mode;
    this.state.activeSide = this.activeSide;
    this.state.selectionStep = this.pvpSelectionStep;

    this.ui.render(
      this.state,
      getKit
    );

    const activeSide =
      this.mode === 'pvp'
        ? this.activeSide
        : 'player';

    const activeFighter =
      this.state[activeSide];

    if (activeFighter?.timeUltimateActive) {
      this.ui.showDilationControls(
        activeFighter.timeUltimateHitsRemaining,
        () => this.playerAction('dilate'),
        this.timeUltimateResolving ||
        this.timeUltimateActionBusy
      );
    } else {
      this.ui.showNormalControls(
        this.state,
        getKit,
        action => this.playerAction(action)
      );
    }


    this.ui.updateBladeButtons(
      this.state,

      blade =>
        this.switchBlade(blade)
    );

  }

}
