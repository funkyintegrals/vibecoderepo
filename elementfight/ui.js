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

    this.bladeButtons =
      [...document.querySelectorAll('.blade-button')];

  }


  setStatus(message) {

    this.battleStatus.textContent =
      message;

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
    onDilate
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
      `Dilate (${remaining})`;

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


    const actions = [
      ['attack', 'Attack Skill'],
      ['utility', 'Utility'],
      ['special', 'Ultimate']
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


        const player =
          state.player;

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
          player.guaranteedCrits > 0
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
