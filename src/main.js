//=============================================================================
// ** Game_Application
//=============================================================================

class Game_Application {

  constructor() {
    this.context = null;
    this.replay = null;
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
  }

  createContext() {
    this.context = new PIXI.Application({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      backgroundColor: 0x10A0C0
    });

    document.body.appendChild(this.context.view);
  }

  advanceForward() {
    this.replay.getCurrentRound().performCurrentAction();
    this.updateSprites();
  }

  createSprites() {
    this.createHandContainers();
    this.createDiscardContainers();
    this.createButtonSprites();
  }

  createHandContainers() {
    this.handContainers = [];

    this.replay.getCurrentRound().hands.forEach(hand => {
      const handContainer = new Container_Hand(hand);
      handContainer.update();

      this.handContainers.push(handContainer);
      this.context.stage.addChild(handContainer);
    });
  }

  createDiscardContainers() {
    this.discardContainers = [];

    for (let i = 0; i < 4; i++) {
      const discardArray = this.replay.getCurrentRound().discards[i];

      const discardContainer = new Container_Discard(i, discardArray);
      discardContainer.update();

      this.discardContainers.push(discardContainer);
      this.context.stage.addChild(discardContainer);
    }
  }
    
  createButtonSprites() {
    this.forwardButton = new PIXI.Text('>>');
    this.forwardButton.x = 720 + 24;
    this.forwardButton.y = 24;

    this.forwardButton.interactive = true;
    this.forwardButton.buttonMode = true;
    this.forwardButton.on('mousedown', this.advanceForward.bind(this));

    this.context.stage.addChild(this.forwardButton);
  }

  updateSprites() {
    this.updateHandContainers();
    this.updateDiscardContainers();
  };
  
  updateHandContainers() {
    this.handContainers.forEach(container => container.update());
  };

  updateDiscardContainers() {
    this.discardContainers.forEach(container => container.update());
  }

}

const app = new Game_Application();

app.preloadAllAssets();