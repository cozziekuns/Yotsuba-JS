//=============================================================================
// ** Container_Hand
//=============================================================================

class Container_Hand extends PIXI.Container {

  constructor(hand) {
    super();
    this.hand = hand;

    this.createTileSprites();
    this.setPivot();
  }

  createTileSprites() {
    for (let i = 0; i < 14; i++) {
      const tileSprite = new Sprite_Tile(-1);
      this.addChild(tileSprite);
    }
  }

  setPivot() {
    this.pivot.x = TILE_WIDTH * 14 / 2;
    this.pivot.y = TILE_HEIGHT / 2;
  }

  update() {
    this.updatePosition();
    this.updateChildren();
  }

  updatePosition() {
    switch (this.hand.actor) {
      case 0:
        this.x = this.pivot.x + (DISPLAY_WIDTH - 14 * TILE_WIDTH) / 2;
        this.y = this.pivot.y + (DISPLAY_HEIGHT - TILE_HEIGHT);
        break;
      case 1:
        this.x = this.pivot.y + (DISPLAY_WIDTH - TILE_WIDTH);
        this.y = this.pivot.x + (DISPLAY_HEIGHT - 14 * TILE_WIDTH) / 2;
        break;
      case 2:
        this.x = this.pivot.x + (DISPLAY_WIDTH - 14 * TILE_WIDTH) / 2;
        this.y = this.pivot.y;
        break;
      case 3:
        this.x = this.pivot.y;
        this.y = this.pivot.x + (DISPLAY_HEIGHT - 14 * TILE_WIDTH) / 2;
        break;
    }

    this.angle = 360 - this.hand.actor * 90;
  }

  updateChildren() {
    this.children.forEach((sprite, index) => {
      sprite.x = index * TILE_WIDTH;
      sprite.tile = this.hand.getTileAtIndex(index);      

      if (sprite.tile === this.hand.getDrawnTile()) {
        sprite.x += 4;
      }

      sprite.update();
    });
  }

}

//=============================================================================
// ** Container_Discard
//=============================================================================

class Container_Discard extends PIXI.Container {

  constructor(actor, discards, riichiIndex) {
    super();
    this.actor = actor;
    this.discards = discards;
    this.riichiIndex = riichiIndex;

    this.createDiscardSprites();
  }

  createDiscardSprites() {
    for (let i = 0; i < 20; i++) {
      const tileSprite = new Sprite_Tile(-1);
      this.addChild(tileSprite);
    }
  }

  update() {
    this.updatePosition();
    this.updateChildren();
  }

  updatePosition() {
    switch (this.actor) {
      case 0:
        this.x = (DISPLAY_WIDTH - GAME_INFO_WIDTH) / 2;
        this.y = (DISPLAY_HEIGHT + GAME_INFO_HEIGHT) / 2;
        break;
      case 1:
        this.x = (DISPLAY_WIDTH + GAME_INFO_WIDTH) / 2;
        this.y = (DISPLAY_HEIGHT + GAME_INFO_HEIGHT) / 2;
        break;
      case 2:
        this.x = (DISPLAY_WIDTH + GAME_INFO_WIDTH) / 2;
        this.y = (DISPLAY_HEIGHT - GAME_INFO_HEIGHT) / 2;
        break;
      case 3:
        this.x = (DISPLAY_WIDTH - GAME_INFO_WIDTH) / 2;
        this.y = (DISPLAY_HEIGHT - GAME_INFO_HEIGHT) / 2;
        break;
    }

    this.angle = 360 - this.actor * 90;
  }

  updateChildren() {
    const riichiIndex = this.riichiIndex[this.actor];

    for (let i = 0; i < this.children.length; i++) {
      const sprite = this.children[i];

      let tile = null;

      if (i >= this.discards.length) {
        tile = -1;
      } else {
        tile = this.discards[i];
      }

      sprite.tile = tile;

      const row = Math.min(Math.floor(i / 6), 2);
      const column = (row === 2 ? i - 12 : i % 6);

      sprite.x = column * TILE_WIDTH;
      sprite.y = row * TILE_HEIGHT;

      if (i === riichiIndex) {
        sprite.angle = 90;
        sprite.x += TILE_HEIGHT;
      } else if (i > riichiIndex && Math.floor(riichiIndex / 6) === row) {
        sprite.x += TILE_HEIGHT - TILE_WIDTH;
      } 

      sprite.update();
    }
  }

}

//=============================================================================
// ** Container_RoundInfo
//=============================================================================

class Container_RoundInfo extends PIXI.Container {

  constructor(round) {
    super();
    this.round = round;

    this.createBackgroundSprite();
    this.createPointsSprites();
    this.createRiichiSprites();
    this.setPosition();
  }

  setPosition() {
    this.x = (DISPLAY_WIDTH - GAME_INFO_WIDTH) / 2;
    this.y = (DISPLAY_HEIGHT - GAME_INFO_HEIGHT) / 2;
  }

  createBackgroundSprite() {
    const backgroundGraphic = new PIXI.Graphics();

    backgroundGraphic.beginFill(0x333333);
    backgroundGraphic.drawRect(0, 0, GAME_INFO_WIDTH, GAME_INFO_HEIGHT);
    backgroundGraphic.endFill();

    this.addChild(backgroundGraphic);
  }

  createRiichiSprites() {
    this.riichiSprites = [];

    for (let i = 0; i < 4; i++) {
      const riichiSprite = new PIXI.Sprite.from(
        PIXI.loader.resources['img/tennbou-001.png'].texture
      );

      if (i % 2 == 0) {
        riichiSprite.x = (GAME_INFO_WIDTH - riichiSprite.height) / 2;
        riichiSprite.y = riichiSprite.width + (i == 0 ? GAME_INFO_HEIGHT - riichiSprite.width : 0);
      } else {
        riichiSprite.x = (i == 1 ? GAME_INFO_HEIGHT - riichiSprite.width : 0);
        riichiSprite.y = (GAME_INFO_WIDTH - riichiSprite.height) / 2;
      }

      riichiSprite.angle = (i % 2 == 0 ? 270 : 0);
      riichiSprite.visible = false;

      this.riichiSprites.push(riichiSprite);
      this.addChild(riichiSprite);
    }
  }

  createPointsSprites() {

  }

  update() {
    this.updatePointsSprites();
    this.updateRiichiSprites();
  }

  updateRiichiSprites() {
    this.round.riichiSteps.forEach((step, index) => {
      this.riichiSprites[index].visible = (step == 2)
    });
  }

}

//=============================================================================
// ** Sprite_Tile
//=============================================================================

class Sprite_Tile extends PIXI.Sprite {

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

    this.texture = PIXI.loader.resources['img/' + this.textureFilename()].texture;
  }

}