
import * as Config from './config.js';
import { Parser_TenhouGame } from './parser.js';
import { Sprite_TextButton, Sprite_Voice } from './sprite.js';
import { Container_Hand, Container_Call, Container_Discard, Container_RoundInfo } from './container.js';

const REPLAY_FILE = 'log/replay2.xml';

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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
      .add(REPLAY_FILE)
      .load(this.preloadAllImages.bind(this));
  }

  preloadAllImages() {
    const imgData = PIXI.Loader.shared.resources['manifest.json'].data['img'];
    const imgFilenames = imgData.map(filename => 'img/' + filename);

    PIXI.Loader.shared.add(imgFilenames);
    PIXI.Loader.shared.onComplete.add(this.parseTenhouLog.bind(this));
  }

  parseTenhouLog() {
    const xmlDocument = PIXI.Loader.shared.resources[REPLAY_FILE].data;
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
      width: Config.WINDOW_WIDTH,
      height: Config.WINDOW_HEIGHT,
      backgroundColor: 0x10A0C0,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    document.body.appendChild(this.context.view);
  }

  //--------------------------------------------------------------------------
  // * Replay Action Logic
  //--------------------------------------------------------------------------

  advanceForward() {
    this.replay.performCurrentAction();
    this.updateSprites();
  }

  rewindBackward() {    
    this.replay.rewindCurrentAction();
    this.updateSprites();
  }

  advanceRound() {
    this.replay.gotoNextRound();
    this.refreshSprites();
  }

  rewindRound() {
    this.replay.gotoPreviousRound();
    this.refreshSprites();
  }

  //--------------------------------------------------------------------------
  // * Interval Logic
  //--------------------------------------------------------------------------

  setAdvanceInterval() {
    this.advanceForward();

    this.mouseTimeout = setTimeout(function() {
      this.mouseInterval = setInterval(
        this.advanceForward.bind(this),
        Config.REPEAT_TICK,
      );
    }.bind(this), Config.REPEAT_INITIAL_TICK);
  }

  setRewindInterval() {
    this.rewindBackward();

    this.mouseTimeout = setTimeout(function() {
      this.mouseInterval = setInterval(
        this.rewindBackward.bind(this),
        Config.REPEAT_TICK,
      );
    }.bind(this), Config.REPEAT_INITIAL_TICK);
  }

  clearMouseIntervalAndTimeout() {
    clearTimeout(this.mouseTimeout);
    clearInterval(this.mouseInterval);

    this.mouseTimeout = null;
    this.mouseInterval = null;
  }

  //--------------------------------------------------------------------------
  // * Simulation Control
  //--------------------------------------------------------------------------

  callSimulateHitori() {
    // TODO: Store these values somewhere.
    for (let i = 0; i < 4; i++) {
      const drawsLeft = Math.ceil((this.replay.currentRound.tilesLeft - i) / 4);

      const tenpaiChance = this.replay.simulateHitori(i, drawsLeft, 1);
      const tenpaiChanceText = (tenpaiChance * 100).toPrecision(4)  + '%';
      const tenpaiText = 'P' + i + ' Hitori Tenpai Chance: ' + tenpaiChanceText;

      const agariChance = this.replay.simulateHitori(i, drawsLeft, 0);
      const agariChanceText = (agariChance * 100).toPrecision(4)  + '%';
      const agariText = 'P' + i + ' Hitori Agari Chance: ' + agariChanceText;

      this.resultSprites[i].text = tenpaiText;
      this.resultSprites[i + 4].text = agariText;
    }
  }

  callSimulateShoubu() {
    const playerDrawsLeft = Math.ceil((this.replay.currentRound.tilesLeft ) / 4);
    const oppDrawsLeft = Math.ceil((this.replay.currentRound.tilesLeft - 3) / 4);
    const drawsLeft = playerDrawsLeft + oppDrawsLeft;

    const agariChance = this.replay.simulateBlackBoxShoubu(2, 4, drawsLeft, 0);
    console.log(agariChance);
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
    this.createResultSprites();
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
    const round = this.replay.currentRound;

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
    this.simulateHitoriButton.on('mousedown', this.callSimulateHitori.bind(this));

    this.context.stage.addChild(this.simulateHitoriButton);

    // --- Simulate Shoubu Button ---
    this.simulateShoubuButton = new Sprite_TextButton('Simulate Shoubu', 720 + 24, 120 + 48);
    this.simulateShoubuButton.on('mousedown', this.callSimulateShoubu.bind(this));

    this.context.stage.addChild(this.simulateShoubuButton);
  }

  createResultSprites() {
    this.resultSprites = [];

    for (let i = 0; i < 4; i++) {
      const tenpaiSprite = new PIXI.Text();
      tenpaiSprite.x = 720 + 24;
      tenpaiSprite.y = 172 + 48 + i * 32; 
            
      this.resultSprites.push(tenpaiSprite);
      this.context.stage.addChild(tenpaiSprite);
    }

    for (let i = 0; i < 4; i++) {
      const agariSprite = new PIXI.Text();
      agariSprite.x = 720 + 24;
      agariSprite.y = 332 + 48 + i * 32;

      this.resultSprites.push(agariSprite);
      this.context.stage.addChild(agariSprite);
    }
  }

  updateSprites() {
    this.updateHandContainers();
    this.updateDiscardContainers();
    this.updateCallContainers();
    this.updateRoundInfoContainer();
    this.updateVoiceSprites();
    this.updateResultSprites();
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

  // TODO: Make Result Sprite a first class citizen
  updateResultSprites() {
    this.resultSprites.forEach((sprite, index) => {
      if (index < 4) {
        sprite.text = 'P' + index + ' Hitori Tenpai Chance: -%';
      } else {
        sprite.text = 'P' + index + ' Hitori Agari Chance: -%';
      }
    });
  }

  //---------------------------------------------------------------------------
  // * Refresh Sprites on Round Update
  //---------------------------------------------------------------------------

  refreshSprites() {
    this.refreshRoundInfoContainer();
    this.updateSprites();
  }

  refreshRoundInfoContainer() {
    this.roundInfoContainer.round = this.replay.currentRound;
  }

}

const app = new Game_Application();
app.preloadAllAssets();