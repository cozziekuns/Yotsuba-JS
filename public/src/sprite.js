import * as Config from './config.js';

//=============================================================================
// ** Sprite_Overlay
//=============================================================================

export class Sprite_Overlay extends PIXI.Container {

  constructor(text) {
    super();
    this.text = text;
    this.hitArea = new PIXI.Rectangle(0, 0, Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT);

    this.createBackgroundSprite();
    this.createTextSprite();
    this.deactivate();
  }

  //--------------------------------------------------------------------------
  // * Control 
  //--------------------------------------------------------------------------

  activate() {
    this.visible = true;
    this.interactive = true;
  }

  deactivate() {
    this.visible = false;
    this.interactive = false;
  }

  //--------------------------------------------------------------------------
  // * Initialization Methods
  //--------------------------------------------------------------------------

  createBackgroundSprite() {
    this.backgroundSprite = new PIXI.Graphics();
    this.backgroundSprite.alpha = 0.5;
    
    this.backgroundSprite.beginFill(0x202020);
    this.backgroundSprite.drawRect(0, 0, Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT);
    this.backgroundSprite.endFill();

    this.addChild(this.backgroundSprite);
  }

  createTextSprite() {
    this.textSprite = new PIXI.Text(this.text);
    this.textSprite.style = Config.VOICE_TEXT_STYLE;
    this.textSprite.x = (Config.WINDOW_WIDTH - this.textSprite.width) / 2;
    this.textSprite.y = (Config.WINDOW_HEIGHT - this.textSprite.height) / 2;

    this.addChild(this.textSprite);
  }

}

//=============================================================================
// ** Sprite_TextButton
//=============================================================================

export class Sprite_TextButton extends PIXI.Container {

  constructor(name, x, y) {
    super();
    this.name = name;
    this.x = x;
    this.y = y;
    this.buttonMode = true;
    this.interactive = true;

    this.createTextSprite();
    this.createBackgroundSprite();
  }

  createTextSprite() {
    this.textSprite = new PIXI.Text(this.name);
    this.textSprite.x = 4;
    this.textSprite.y = 4;

    this.addChild(this.textSprite);
  }

  createBackgroundSprite() {
    // TODO: Make this button look prettier
    const graphics = new PIXI.Graphics();

    graphics.lineStyle(2, 0x404040, 1);
    graphics.beginFill(0xF0F0F0);
    graphics.drawRoundedRect(
      0,
      0,
      this.textSprite.width + 8,
      this.textSprite.height + 8,
      4,
    );
    graphics.endFill();

    this.backgroundSprite = graphics;
    this.addChildAt(this.backgroundSprite, 0);
  }

}

//=============================================================================
// ** Sprite_Tile
//=============================================================================

export class Sprite_Tile extends PIXI.Sprite {

  constructor(tile) {
    super();
    this.tile = tile;
  }

  textureFilename() {
    let prefix = ''

    // TODO: turn this into a real util function
    const tileValue = Math.floor((this.tile % 36) / 4) + 1;
    const suits = ['man', 'pin', 'sou', 'ji'];

    switch(this.tile) {
      case -2:
        prefix = 'back';
        break;
      case 16:
        prefix = 'aka1';
        break;
      case 52:
        prefix = 'aka2';
        break;
      case 88:
        prefix = 'aka3';
        break;
      default:
        prefix = suits[Math.floor(this.tile / 36)];
        prefix += tileValue;
        break;
    }

    return prefix + '.png';
  }

  update() {
    if (this.tile === -1) {
      this.texture = PIXI.Texture.EMPTY;
      return;
    }

    const filename = 'img/' + this.textureFilename();
    this.texture = PIXI.Loader.shared.resources[filename].texture;
  }

}

//=============================================================================
// ** Sprite_Voice
//=============================================================================

export class Sprite_Voice extends PIXI.Text {

  constructor(index, actor, playerIndex) {
    super();
    this.index = index;
    this.actor = actor;
    this.playerIndex = playerIndex;

    this.style = Config.VOICE_TEXT_STYLE;
  }

  update() {
    this.updateTextString()
    this.updateTextPosition();
  }

  updateTextString() {
    if (this.actor.voice >= 0) {
      this.text = Config.VOICE_TEXT[this.actor.voice];
    } else {
      this.text = '';
    }
  }

  updateTextPosition() {
    const displayIndex = (4 + this.index - this.playerIndex) % 4;

    switch(displayIndex) {
      case 0:
        this.x = (Config.DISPLAY_WIDTH - this.width) / 2;
        this.y = Config.DISPLAY_HEIGHT - 192;
        break;
      case 1:
        this.x = Config.DISPLAY_WIDTH - 192;
        this.y = (Config.DISPLAY_HEIGHT + this.width) / 2;
        break;
      case 2:
        this.x = (Config.DISPLAY_WIDTH + this.width) / 2;
        this.y = 192;
        break;
      case 3:
        this.x = 192;
        this.y = (Config.DISPLAY_HEIGHT - this.width) / 2;
        break;
    }

    this.angle = 360 - 90 * displayIndex;
  }

}
