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
      width: 1280,
      height: 720,
      backgroundColor: 0x10A0C0
    });

    document.body.appendChild(this.context.view);
  }

  createSprites() {
    this.createTileSprites();
  }

  createTileSprites() {
    this.tileSprites = [];

    this.replay.getCurrentRound().hands.forEach(hand => {
      hand.tiles.forEach((tile, index) => this.createTileSprite(tile, index));
    });
  }

  // Each hand should be a container
  createTileSprite(tile, index) {
    const tileSprite = new TileSprite(tile);

    tileSprite.x = index * 48;
    tileSprite.y = 240;
    tileSprite.update();

    this.tileSprites.push(tileSprite);
    this.context.stage.addChild(tileSprite);
  }

}

const app = new Game_Application();

app.preloadAllAssets();