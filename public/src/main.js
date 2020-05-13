
import * as Config from './config.js';
import { Parser_TenhouGame } from './parser.js';
import { Sprite_TextButton, Sprite_Voice } from './sprite.js';
import { Container_Hand, Container_Call, Container_Discard, Container_RoundInfo } from './container.js';

const REPLAY_FILE = 'log/replay4.xml';

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

  loadTenhouLog(url) {
    const regexMatch = url.match(/log=([^&]+)/);
 
    if (!regexMatch || !regexMatch[1]) {
      // Alert the user that their URL is malformed
      return;
    }
  
    const uuid = regexMatch[1];

    const eventListener = () => {
      if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
        const xmlParser = new DOMParser();
        const logBody = xmlParser.parseFromString(request.responseText, 'text/xml');

        const parser = new Parser_TenhouGame(logBody);

        this.replay = parser.parseLog();
        this.replay.startCurrentRound();

        console.log('all done!');
        this.refreshSprites();
      }
    }

    const request = new XMLHttpRequest();
    request.addEventListener('readystatechange', eventListener);

    request.open('POST', '/proxy', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify({uuid: uuid}));
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

  changePerspective() {
    this.replay.perspective = (this.replay.perspective + 1) % 4;
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
  // * Sprite Handling Logic
  //--------------------------------------------------------------------------

  createSprites() {
    this.createHandContainers();
    this.createDiscardContainers();
    this.createRoundInfoContainer();
    this.createCallContainers();
    this.createVoiceSprites();
    this.createButtonSprites();
    this.createUrlInputSprite();
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
    this.forwardButton = new Sprite_TextButton('>>', Config.DISPLAY_WIDTH + 48, 24);
    this.forwardButton.on('mousedown', this.setAdvanceInterval.bind(this));
    this.forwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.forwardButton);

    // --- Backward Button ---
    this.backwardButton = new Sprite_TextButton('<<', Config.DISPLAY_WIDTH + 96, 24);
    this.backwardButton.on('mousedown', this.setRewindInterval.bind(this));
    this.backwardButton.on('mouseup', this.clearMouseIntervalAndTimeout.bind(this));

    this.context.stage.addChild(this.backwardButton);

    // --- Next Round Button ---
    this.nextRoundButton = new Sprite_TextButton('>❙', Config.DISPLAY_WIDTH + 48, 72);
    this.nextRoundButton.on('mousedown', this.advanceRound.bind(this));

    this.context.stage.addChild(this.nextRoundButton);

    // --- Prev Round Button ---
    this.previousRoundButton = new Sprite_TextButton('❙<', Config.DISPLAY_WIDTH + 96, 72);
    this.previousRoundButton.on('mousedown', this.rewindRound.bind(this));

    this.context.stage.addChild(this.previousRoundButton);

    // --- Switch Perspective Button ---
    this.perspectiveButton = new Sprite_TextButton('Perspective', Config.DISPLAY_WIDTH + 48, 120);
    this.perspectiveButton.on('mousedown', this.changePerspective.bind(this));

    this.context.stage.addChild(this.perspectiveButton);
  }

  createUrlInputSprite() {
    this.urlInput = new PIXI.TextInput({
      input: { fontSize: '24px', width: '600px', padding: '12px' },
      box: { fill: 0xEEEEEE },
    });

    this.urlInput.x = Config.DISPLAY_WIDTH + 48;
    this.urlInput.y = Config.DISPLAY_HEIGHT - 72;

    this.urlInput.placeholder = 'Input Tenhou URL...';
    this.urlInput.substituteText = false;

    this.urlInput.on('keydown', keycode => {
      if (keycode == 13) {
        this.loadTenhouLog(this.urlInput.text);
        this.urlInput.text = '';
        this.urlInput.blur();
      }
    });

    this.context.stage.addChild(this.urlInput);
  }

  updateSprites() {
    this.updateHandContainers();
    this.updateDiscardContainers();
    this.updateCallContainers();
    this.updateRoundInfoContainer();
    this.updateVoiceSprites();
  }

  updateHandContainers() {
    this.handContainers.forEach((container, index) => {
      const actorIndex = (index + this.replay.perspective) % 4;

      container.actor = this.replay.actors[actorIndex];
      container.update();
    });
  }

  updateDiscardContainers() {
    this.discardContainers.forEach((container, index) => {
      const actorIndex = (index + this.replay.perspective) % 4;

      container.actor = this.replay.actors[actorIndex];
      container.update();
    });
  }

  updateCallContainers() {
    this.callContainers.forEach((container, index) => {
      const actorIndex = (index + this.replay.perspective) % 4;

      container.actor = this.replay.actors[actorIndex];
      container.update();
    });
  }

  updateRoundInfoContainer() {
    this.roundInfoContainer.perspective = this.replay.perspective;
    this.roundInfoContainer.update();
  }

  updateVoiceSprites() {
    this.voiceSprites.forEach((sprite, index) => {
      const actorIndex = (index + this.replay.perspective) % 4;

      sprite.actor = this.replay.actors[actorIndex];
      sprite.update();
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
