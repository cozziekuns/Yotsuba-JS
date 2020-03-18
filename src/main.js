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
    this.replay.startCurrentRound();
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
    this.replay.getCurrentRound().performCurrentAction();
    this.updateSprites();
  }

  rewindBackward() {    
    this.replay.getCurrentRound().rewindCurrentAction();
    this.updateSprites();
  }

  advanceRound() {
    this.replay.getCurrentRound().rewindToStart();
    this.replay.gotoNextRound();
    
    this.refreshSprites();
  }

  rewindRound() {
    this.replay.getCurrentRound().rewindToStart();
    this.replay.gotoPreviousRound();

    this.refreshSprites();
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
    this.createCallContainers();
    this.createVoiceSprites();
    this.createButtonSprites();
  }

  createHandContainers() {
    this.handContainers = [];

    this.replay.actors.forEach((actor, index) => {
      const handContainer = new Container_Hand(index, actor);

      this.handContainers.push(handContainer);
      this.context.stage.addChild(handContainer);
    });
  }

  createDiscardContainers() {
    this.discardContainers = [];

    this.replay.actors.forEach((actor, index) => {
      const discardContainer = new Container_Discard(index, actor);

      this.discardContainers.push(discardContainer);
      this.context.stage.addChild(discardContainer);
    });
  }

  createCallContainers() {
    this.callContainers = [];

    this.replay.actors.forEach((actor, index) => {
      const callContainer = new Container_Call(index, actor);

      this.callContainers.push(callContainer);
      this.context.stage.addChild(callContainer);
    });
  }

  createRoundInfoContainer() {
    const round = this.replay.getCurrentRound();

    this.roundInfoContainer = new Container_RoundInfo(round, this.replay.actors);
    this.context.stage.addChild(this.roundInfoContainer);
  }
  
  createVoiceSprites() {
    this.voiceSprites = [];

    this.replay.actors.forEach((actor, index) => {
      const voiceSprite = new Sprite_Voice(index, actor);

      this.voiceSprites.push(voiceSprite);
      this.context.stage.addChild(voiceSprite);
    });
  }

  // TODO: Clean this up... eventually...
  createButtonSprites() {
    // --- Forward Button ---
    this.forwardButton = new Sprite_TextButton('>>', 720 + 24, 24);
    this.forwardButton.on('mousedown', this.setAdvanceInterval.bind(this));
    this.forwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.forwardButton);

    // --- Backward Button ---
    this.backwardButton = new Sprite_TextButton('<<', 720 + 72, 24);
    this.backwardButton.on('mousedown', this.setRewindInterval.bind(this));
    this.backwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.backwardButton);

    // --- Next Round Button ---
    this.nextRoundButton = new Sprite_TextButton('>❙', 720 + 24, 72);
    this.nextRoundButton.on('mousedown', this.advanceRound.bind(this));

    this.context.stage.addChild(this.nextRoundButton);

    // --- Prev Round Button
    this.previousRoundButton = new Sprite_TextButton('❙<', 720 + 72, 72);
    this.previousRoundButton.on('mousedown', this.rewindRound.bind(this));

    this.context.stage.addChild(this.previousRoundButton);

    // --- Simulate Hitori Button ---
    this.simulateHitoriButton = new Sprite_TextButton('Simulate Hitori', 720 + 24, 120);

    this.context.stage.addChild(this.simulateHitoriButton);
  }

  updateSprites() {
    this.updateHandContainers();
    this.updateDiscardContainers();
    this.updateCallContainers();
    this.updateRoundInfoContainer();
    this.updateVoiceSprites();
  }

  updateHandContainers() {
    this.handContainers.forEach(container => container.update());
  }

  updateDiscardContainers() {
    this.discardContainers.forEach(container => container.update());
  }

  updateCallContainers() {
    this.callContainers.forEach(container => container.update());
  }

  updateRoundInfoContainer() {
    this.roundInfoContainer.update();
  }

  updateVoiceSprites() {
    this.voiceSprites.forEach(sprite => sprite.update());
  }

  //---------------------------------------------------------------------------
  // * Refresh Sprites on Round Update
  //---------------------------------------------------------------------------

  refreshSprites() {
    this.refreshRoundInfoContainer();
    this.updateSprites();
  }

  refreshRoundInfoContainer() {
    this.roundInfoContainer.round = this.replay.getCurrentRound();
  }

}

const app = new Game_Application();

app.preloadAllAssets();