export class UI {

  constructor() {

    this.playerHp =
      document.getElementById('playerHp');

    this.playerFocus =
      document.getElementById('playerFocus');

    this.enemyHp =
      document.getElementById('enemyHp');

    this.enemyFocus =
      document.getElementById('enemyFocus');

    this.playerBlade =
      document.getElementById('playerBlade');

    this.enemyBlade =
      document.getElementById('enemyBlade');

    this.battleStatus =
      document.getElementById('battleStatus');

    this.battleLog =
      document.getElementById('battleLog');

    this.turnInfo =
      document.getElementById('turnInfo');

    this.actionGrid =
      document.getElementById('actionGrid');

    this.playerPortrait =
      document.getElementById('playerPortrait');

    this.enemyPortrait =
      document.getElementById('enemyPortrait');

    this.playerWeapon =
      document.getElementById('playerWeapon');

    this.enemyWeapon =
      document.getElementById('enemyWeapon');

    this.bladeButtons =
      [...document.querySelectorAll('.blade-button')];

    this.timeStopEffect = null;
    this.renderedLog = null;

  }


  setStatus(message) {

    this.battleStatus.textContent =
      message;

  }


  setAnimationLock(locked) {

    this.actionGrid
      .querySelectorAll('button')
      .forEach(button => {
        button.disabled = locked || button.disabled;
      });

    this.bladeButtons.forEach(button => {
      button.disabled = locked || button.disabled;
    });

  }


  playUltimateAnimation(
    blade,
    attackerSide,
    defenderSide,
    options = {}
  ) {

    const defender =
      defenderSide === 'player'
        ? this.playerPortrait
        : this.enemyPortrait;

    const attacker =
      attackerSide === 'player'
        ? this.playerPortrait
        : this.enemyPortrait;

    if (blade === 'Light') {
      return this.playShimmerAnimation(attacker);
    }

    if (blade === 'Electricity') {
      return this.playThunderstormAnimation(defender);
    }

    if (blade === 'Time') {
      if (options.timeStop) {
        return this.playTimeStopSetup(defender, options);
      }

      return this.playTimeAnimation(defender, options);
    }

    return Promise.resolve();

  }


  playThunderstormAnimation(defender) {

    const bolts = [];

    for (let i = 0; i < 3; i++) {
      const bolt = document.createElement('div');

      bolt.className = 'ultimate-effect thunder-bolt';
      bolt.textContent = '⚡';
      const directions = [
        { x: '50%', y: '50%', startX: '-115px', startY: '-85px', endX: '0px', endY: '0px', rotation: '45deg' },
        { x: '50%', y: '50%', startX: '115px', startY: '-75px', endX: '0px', endY: '0px', rotation: '-45deg' },
        { x: '50%', y: '50%', startX: '0px', startY: '-125px', endX: '0px', endY: '0px', rotation: '0deg' }
      ][i];

      bolt.style.setProperty('--bolt-x', directions.x);
      bolt.style.setProperty('--bolt-y', directions.y);
      bolt.style.setProperty('--bolt-start-x', directions.startX);
      bolt.style.setProperty('--bolt-start-y', directions.startY);
      bolt.style.setProperty('--bolt-end-x', directions.endX);
      bolt.style.setProperty('--bolt-end-y', directions.endY);
      bolt.style.setProperty('--bolt-rotation', directions.rotation);

      defender.appendChild(bolt);
      bolts.push(bolt);
    }

    return new Promise(resolve => {
      let finished = 0;

      bolts.forEach(bolt => {
        bolt.addEventListener(
          'animationend',
          () => {
            finished++;

            if (finished === bolts.length) {
              bolts.forEach(item => item.remove());
              resolve();
            }
          },
          { once: true }
        );
      });
    });

  }


  getTimeTarget(defender) {

    return defender === this.playerPortrait
      ? this.playerWeapon
      : this.enemyWeapon;

  }


  getTimeTargetOffset(defender) {

    const target =
      this.getTimeTarget(defender);

    const defenderRect =
      defender.getBoundingClientRect();

    const targetRect =
      target.getBoundingClientRect();

    return {
      x:
        targetRect.left +
        targetRect.width / 2 -
        (defenderRect.left + defenderRect.width / 2),

      y:
        targetRect.top +
        targetRect.height / 2 -
        (defenderRect.top + defenderRect.height / 2)
    };

  }


  createTimeSword(defender, index, total) {

    const targetOffset =
      this.getTimeTargetOffset(defender);

    const sword =
      document.createElement('div');

    sword.className =
      'ultimate-effect time-sword';

    sword.textContent =
      '🗡️';

    // Each sword gets an independent random point on the same fixed-radius circle.
    const orbitAngle =
      Math.random() * Math.PI * 2;

    const radius = 125;

    const startX =
      Math.cos(orbitAngle) * radius;

    const startY =
      Math.sin(orbitAngle) * radius;

    // Aim at the actual weapon before the sword is revealed.
    const targetAngle =
      Math.atan2(
        targetOffset.y - startY,
        targetOffset.x - startX
      ) * 180 / Math.PI;

    const swordTipAngle = 315;

    const swordRotation =
      targetAngle - swordTipAngle;

    sword.style.setProperty(
      '--sword-start-x',
      startX + 'px'
    );

    sword.style.setProperty(
      '--sword-start-y',
      startY + 'px'
    );

    sword.style.setProperty(
      '--sword-hold-x',
      startX * 0.62 + 'px'
    );

    sword.style.setProperty(
      '--sword-hold-y',
      startY * 0.62 + 'px'
    );

    sword.style.setProperty(
      '--sword-target-x',
      targetOffset.x + 'px'
    );

    sword.style.setProperty(
      '--sword-target-y',
      targetOffset.y + 'px'
    );

    // Continue past the blade after impact.
    const passX =
      targetOffset.x +
      (targetOffset.x - startX) * 0.45;

    const passY =
      targetOffset.y +
      (targetOffset.y - startY) * 0.45;

    sword.style.setProperty(
      '--sword-pass-x',
      passX + 'px'
    );

    sword.style.setProperty(
      '--sword-pass-y',
      passY + 'px'
    );

    sword.style.setProperty(
      '--sword-rotation',
      swordRotation + 'deg'
    );

    defender.appendChild(sword);

    return {
      sword,
      targetOffset
    };

  }


  createTimeSwords(defender, count) {

    const swords = [];

    for (let i = 0; i < count; i++) {
      const created =
        this.createTimeSword(
          defender,
          i,
          count
        );

      swords.push(
        created.sword
      );
    }

    return swords;

  }

  playTimeStopSetup(defender, options = {}) {

    const count =
      options.timeHits || 20;

    const field =
      document.createElement('div');

    field.className =
      'ultimate-effect time-field';

    defender.appendChild(field);

    const targetOffset =
      this.getTimeTargetOffset(defender);

    field.style.setProperty(
      '--target-x',
      targetOffset.x + 'px'
    );

    field.style.setProperty(
      '--target-y',
      targetOffset.y + 'px'
    );

    return new Promise(resolve => {
      field.addEventListener(
        'animationend',
        () => {
          let stopwatch = null;

          if (
            options.showStopwatch !== false
          ) {
            stopwatch =
              document.createElement('div');

            stopwatch.className =
              'ultimate-effect time-stopwatch';

            stopwatch.textContent =
              '⏱️';

            stopwatch.style.setProperty(
              '--target-x',
              targetOffset.x + 'px'
            );

            stopwatch.style.setProperty(
              '--target-y',
              targetOffset.y + 'px'
            );

            defender.appendChild(stopwatch);
          }

          this.timeStopEffect = {
            defender,
            field,
            stopwatch,
            swords:
              options.summonAllSwords
                ? this.createTimeSwords(
                    defender,
                    count
                  )
                : [],
            targetOffset,
            count
          };

          resolve();
        },
        { once: true }
      );
    });

  }


  playTimeStopSword(defender, index, total) {

    const effect =
      this.timeStopEffect;

    if (!effect) {
      return Promise.resolve();
    }

    const created =
      this.createTimeSword(
        defender,
        index,
        total
      );

    effect.swords.push(
      created.sword
    );

    return new Promise(resolve => {
      created.sword.addEventListener(
        'animationend',
        resolve,
        { once: true }
      );
    });

  }



  playTimeStopReleaseSword(index, onHit) {

    const effect =
      this.timeStopEffect;

    if (
      !effect ||
      !effect.swords[index]
    ) {
      return Promise.resolve();
    }

    const sword =
      effect.swords[index];

    if (effect.field) {
      effect.field.remove();
      effect.field = null;
    }

    const holdTransform =
      `translate(-50%, -50%)` +
      ` translate(var(--sword-hold-x), var(--sword-hold-y))` +
      ` rotate(calc(var(--sword-rotation) + 180deg))` +
      ` scale(1)`;

    sword.style.animation = 'none';
    sword.style.opacity = '1';
    sword.style.transform = holdTransform;

    return new Promise(resolve => {

      if (onHit) {
        onHit(index);
      }

      sword.classList.remove(
        'time-sword'
      );

      sword.classList.add(
        'time-sword-impact'
      );

      sword.style.animation = '';

      sword.addEventListener(
        'animationend',
        resolve,
        { once: true }
      );

    });

  }


  playTimeStopRelease(onHit) {

    const effect =
      this.timeStopEffect;

    if (
      !effect ||
      !effect.swords.length
    ) {
      return Promise.resolve();
    }

    const swords =
      [...effect.swords];

    // Time resumes after the field vanishes.
    effect.field.remove();
    effect.field = null;

    return new Promise(resolve => {
      let finished = 0;
      let releaseDelay = 0;

      swords.forEach((sword, index) => {

        const gap =
          Math.max(
            0,
            300 - index * 10
          );

        const currentDelay =
          releaseDelay;

        // Keep the sword frozen at its hold position during the delay.
        const holdTransform =
          `translate(-50%, -50%)` +
          ` translate(var(--sword-hold-x), var(--sword-hold-y))` +
          ` rotate(calc(var(--sword-rotation) + 180deg))` +
          ` scale(1)`;

        sword.style.animation = 'none';
        sword.style.opacity = '1';
        sword.style.transform = holdTransform;

        window.setTimeout(
          () => {

            if (onHit) {
              onHit(index);
            }

            sword.classList.remove(
              'time-sword'
            );

            sword.classList.add(
              'time-sword-impact'
            );

            sword.style.animation = '';

          },
          currentDelay
        );

        releaseDelay += gap;

        sword.addEventListener(
          'animationend',
          () => {

            finished++;

            if (finished === swords.length) {
              resolve();
            }

          },
          { once: true }
        );

      });

    });

  }


  clearTimeStopEffects() {

    if (!this.timeStopEffect) {
      return;
    }

    const {
      defender,
      field,
      stopwatch,
      swords
    } = this.timeStopEffect;

    swords.forEach(
      sword => sword.remove()
    );

    if (field) {
      field.remove();
    }

    if (stopwatch) {
      stopwatch.remove();
    }

    defender
      .querySelectorAll(
        '.time-sword, .time-sword-impact'
      )
      .forEach(
        sword => sword.remove()
      );

    this.timeStopEffect = null;

  }


  showAccumulatedDamage(
    defender,
    damage,
    critical = false,
    hitCount = 1
  ) {

    const portrait =
      defender === 'player'
        ? this.playerPortrait
        : this.enemyPortrait;

    let number =
      portrait.querySelector(
        '.damage-total'
      );

    if (!number) {
      number =
        document.createElement('div');

      number.className =
        'damage-number damage-total';

      portrait.appendChild(number);
    }

    number.textContent =
      damage;

    number.classList.toggle(
      'critical',
      critical
    );

    const damageScale =
      1 + Math.min(
        0.22,
        hitCount * 0.011
      );

    number.style.setProperty(
      '--damage-scale',
      damageScale
    );

    number.classList.remove(
      'damage-total-pulse'
    );

    void number.offsetWidth;

    number.classList.add(
      'damage-total-pulse'
    );

    return number;

  }


  finishAccumulatedDamage(
    defender
  ) {

    const portrait =
      defender === 'player'
        ? this.playerPortrait
        : this.enemyPortrait;

    const number =
      portrait.querySelector(
        '.damage-total'
      );

    if (!number) {
      return;
    }

    number.classList.remove(
      'damage-total-pulse'
    );

    void number.offsetWidth;

    number.classList.add(
      'damage-total-fade'
    );

    number.addEventListener(
      'animationend',
      () => number.remove(),
      { once: true }
    );

  }


  playShimmerAnimation(attacker) {

    const star = document.createElement('div');

    star.className = 'ultimate-effect shimmer-star';
    star.textContent = '⭐';

    attacker.appendChild(star);

    return new Promise(resolve => {
      star.addEventListener(
        'animationend',
        () => {
          star.remove();
          resolve();
        },
        { once: true }
      );
    });

  }


  renderLog(log) {

    this.battleLog.replaceChildren();

    log
      .slice()
      .reverse()
      .forEach(message => {

        const li =
          document.createElement('li');

        li.textContent = message;

        this.battleLog.appendChild(li);

      });

  }


  addDamageNumber(
    defender,
    damage,
    critical = false
  ) {

    const portrait =
      defender === 'player'
        ? this.playerPortrait
        : this.enemyPortrait;

    const number =
      document.createElement('div');

    number.className =
      'damage-number';

    if (critical) {
      number.classList.add('critical');
    }

    number.textContent =
      damage;

    number.style.marginLeft =
      `${Math.random() * 50 - 25}px`;

    portrait.appendChild(number);

    number.addEventListener(
      'animationend',
      () => number.remove(),
      { once: true }
    );

  }


  render(state, getKit) {

    const player =
      state.player;

    const enemy =
      state.enemy;


    this.playerHp.textContent =
      player.hp;

    this.playerFocus.textContent =
      `${player.focus} / ${getKit(player.blade).focusCap}`;


    this.enemyHp.textContent =
      enemy.hp;

    this.enemyFocus.textContent =
      `${enemy.focus} / ${getKit(enemy.blade).focusCap}`;


    this.playerBlade.textContent =
      `Blade: ${player.blade}`;

    this.enemyBlade.textContent =
      `Blade: ${enemy.blade}`;


    this.renderLog(
      state.log
    );


    this.updateTurnInfo(
      state
    );

  }


  updateTurnInfo(state) {

    if (state.isBattleOver) {

      this.turnInfo.textContent =
        'Battle finished';

      return;
    }


    if (
      state.player.timeUltimateActive
    ) {

      this.turnInfo.textContent =
        `Time Dilation • ${state.player.timeUltimateHitsRemaining} hits remaining`;

      return;
    }


    if (state.phase === 'enemy') {

      this.turnInfo.textContent =
        'Enemy turn...';

      return;
    }


    const actions =
      state.player.actionsThisTurn;


    let text =
      `Turn ${state.turn} • ${actions} action${actions === 1 ? '' : 's'} remaining`;


    if (
      state.player.timeDoubleTurnActive
    ) {

      text +=
        ' • Double Turn';

    }


    this.turnInfo.textContent =
      text;

  }


  showDilationControls(
    remaining,
    onDilate,
    disabled = false
  ) {

    this.actionGrid.replaceChildren();

    this.actionGrid.classList.add(
      'dilate-mode'
    );


    const button =
      document.createElement('button');

    button.type = 'button';

    button.className =
      'action-button dilate-button';

    button.textContent =
      `Dilate (${Math.max(0, remaining)})`;

    button.disabled =
      remaining <= 0 ||
      disabled;

    button.addEventListener(
      'click',
      onDilate
    );

    this.actionGrid.appendChild(
      button
    );

  }


  showNormalControls(
    state,
    getKit,
    onAction
  ) {

    this.actionGrid.replaceChildren();

    this.actionGrid.classList.remove(
      'dilate-mode'
    );


    const player = state.player;
    const kit = getKit(player.blade);

    const actions = [
      ['attack', kit.attackName],
      ['utility', kit.utilityName],
      ['special', kit.specialName]
    ];


    actions.forEach(
      ([action, label]) => {

        const button =
          document.createElement('button');

        button.type = 'button';

        button.className =
          'action-button';

        button.dataset.action =
          action;

        button.textContent =
          label;


        let disabled =
          state.isBattleOver ||
          state.phase !== 'player';


        if (
          action === 'special' &&
          player.focus <
            getKit(player.blade).focusCap
        ) {

          disabled = true;

          button.title =
            'Not enough Focus';

        }


        if (
          action === 'utility' &&
          player.blade === 'Time' &&
          player.timeDoubleTurnActive
        ) {

          disabled = true;

          button.title =
            'Utility is disabled during the double turn.';

        }


        if (
          action === 'utility' &&
          player.blade === 'Electricity' &&
          player.increasedCrits > 0
        ) {

          disabled = true;

          button.title =
            'Electricity Utility is already active.';

        }


        button.disabled =
          disabled;


        button.addEventListener(
          'click',
          () => onAction(action)
        );


        this.actionGrid.appendChild(
          button
        );

      }
    );

  }


  updateBladeButtons(
    state,
    onBladeChange
  ) {

    this.bladeButtons.forEach(
      button => {

        const active =
          button.dataset.blade ===
          state.player.blade;

        button.classList.toggle(
          'active',
          active
        );


        button.disabled =
          state.isBattleOver ||
          state.phase !== 'player' ||
          state.player.timeUltimateActive;


        button.onclick = () => {

          onBladeChange(
            button.dataset.blade
          );

        };

      }
    );

  }

}
