//=============================================================================
// ** Game_Application
//=============================================================================

class Game_Application {

  constructor() {
    this.context = null;
    this.replay = null;
    this.mouseTimeout = null;
    this.mouseInterval = null;
  }

  preloadAllAssets() {
    PIXI.loader
      .add('manifest.json')
      .add('log/replay.xml')
      .load(this.preloadAllImages.bind(this));
  }

  preloadAllImages() {
    const img_filenames = PIXI.loader.resources['manifest.json'].data['img'].map(
      filename => 'img/' + filename
    );

    PIXI.loader.add(img_filenames);
    PIXI.loader.onComplete.add(this.parseTenhouLog.bind(this));
  }

  parseTenhouLog() {
    const xmlDocument = PIXI.loader.resources['log/replay.xml'].data;
    const parser = new Parser_TenhouGame(xmlDocument);

    this.replay = parser.parseLog();
    this.run();
  }

  run() {
    this.createContext();
    this.createSprites();
    this.updateSprites();
  }

  createContext() {
    this.context = new PIXI.Application({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      backgroundColor: 0x10A0C0,
      resolution: 2,
      autoDensity: true,
    });

    document.body.appendChild(this.context.view);
  }

  //--------------------------------------------------------------------------
  // * Replay Action Logic
  //--------------------------------------------------------------------------

  advanceForward() {
    const currentRoundIndex = this.replay.currentRound;

    this.replay.getCurrentRound().performCurrentAction();

    if (currentRoundIndex !== this.replay.currentRound) {
      this.refreshSprites();
    }

    this.updateSprites();
  }

  rewindBackward() {
    const currentRoundIndex = this.replay.currentRound;
    
    this.replay.getCurrentRound().rewindCurrentAction();

    if (currentRoundIndex !== this.replay.currentRound) {
      this.refreshSprites();
    }

    this.updateSprites();
  }

  //--------------------------------------------------------------------------
  // * Interval Logic
  //--------------------------------------------------------------------------

  setAdvanceInterval() {
    this.advanceForward();

    this.mouseTimeout = setTimeout(function() {
      this.mouseInterval = setInterval(this.advanceForward.bind(this), REPEAT_TICK);
    }.bind(this), REPEAT_INITIAL_TICK);
  }

  setRewindInterval() {
    this.rewindBackward();

    this.mouseTimeout = setTimeout(function() {
      this.mouseInterval = setInterval(this.rewindBackward.bind(this), REPEAT_TICK);
    }.bind(this), REPEAT_INITIAL_TICK);
  }

  clearMouseIntervalAndTimeout() {
    clearTimeout(this.mouseTimeout);
    clearInterval(this.mouseInterval);

    this.mouseTimeout = null;
    this.mouseInterval = null;
  }

  //--------------------------------------------------------------------------
  // * Sprite Handling Logic
  //--------------------------------------------------------------------------

  createSprites() {
    this.createHandContainers();
    this.createDiscardContainers();
    this.createRoundInfoContainer();
    this.createButtonSprites();
  }

  createHandContainers() {
    this.handContainers = [];

    this.replay.getCurrentRound().hands.forEach(hand => {
      const handContainer = new Container_Hand(hand);

      this.handContainers.push(handContainer);
      this.context.stage.addChild(handContainer);
    });
  }

  createDiscardContainers() {
    this.discardContainers = [];

    for (let i = 0; i < 4; i++) {
      const discardArray = this.replay.getCurrentRound().discards[i];
      const riichiIndex = this.replay.getCurrentRound().riichiIndex;

      const discardContainer = new Container_Discard(i, discardArray, riichiIndex);

      this.discardContainers.push(discardContainer);
      this.context.stage.addChild(discardContainer);
    }
  }

  createRoundInfoContainer() {
    const round = this.replay.getCurrentRound();

    this.roundInfoContainer = new Container_RoundInfo(round);
    this.context.stage.addChild(this.roundInfoContainer);
  }
    
  createButtonSprites() {
    this.forwardButton = new PIXI.Text('>>');
    this.forwardButton.x = 720 + 24;
    this.forwardButton.y = 24;

    this.forwardButton.interactive = true;
    this.forwardButton.buttonMode = true;
    this.forwardButton.on('mousedown', this.setAdvanceInterval.bind(this));
    this.forwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.forwardButton);

    this.backwardButton = new PIXI.Text('<<');
    this.backwardButton.x = 720 + 72;
    this.backwardButton.y = 24;

    this.backwardButton.interactive = true;
    this.backwardButton.buttonMode = true;
    this.backwardButton.on('mousedown', this.setRewindInterval.bind(this));
    this.backwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.backwardButton);
  }

  updateSprites() {
    this.updateHandContainers();
    this.updateDiscardContainers();
    this.updateRoundInfoContainer();
  }

  updateHandContainers() {
    this.handContainers.forEach(container => container.update());
  }

  updateDiscardContainers() {
    this.discardContainers.forEach(container => container.update());
  }

  updateRoundInfoContainer() {
    this.roundInfoContainer.update();
  }

  //---------------------------------------------------------------------------
  // * Refresh Sprites on Round Update
  //---------------------------------------------------------------------------

  refreshSprites() {
    this.refreshHandContainers();
    this.refreshDiscardContainers();
    this.refreshRoundInfoContainer();
  }

  refreshHandContainers() {
    this.handContainers.forEach((container, index) => {
      container.hand = this.replay.getCurrentRound().hands[index];
    });
  }

  refreshDiscardContainers() {
    this.discardContainers.forEach((container, index) => {
      container.discards = this.replay.getCurrentRound().discards[index];
      container.riichiIndex = this.replay.getCurrentRound().riichiIndex;
    });
  }

  refreshRoundInfoContainer() {
    this.roundInfoContainer.round = this.replay.getCurrentRound();
  }

}

const app = new Game_Application();

app.preloadAllAssets();