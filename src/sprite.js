//=============================================================================
// ** Container_Discard
//=============================================================================

class Container_Discard extends PIXI.Container {

  constructor(actor, discards) {
    super();
    this.actor = actor;
    this.discards = discards;

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
    if (this.actor === 0) {
      console.log(this.discards);
    }
  }

  updatePosition() {
    switch (this.actor) {
      case 0:
        this.x = (DISPLAY_WIDTH - 6 * TILE_WIDTH) / 2;
        this.y = DISPLAY_HEIGHT / 2 + TILE_WIDTH * 3;
        break;
      case 1:
        this.x = (DISPLAY_WIDTH + 6 * TILE_WIDTH) / 2;
        this.y = DISPLAY_HEIGHT / 2 + TILE_WIDTH * 3;
        break;
      case 2:
        this.x = (DISPLAY_WIDTH + 6 * TILE_WIDTH) / 2;
        this.y = DISPLAY_HEIGHT / 2 - TILE_WIDTH * 3;
        break;
      case 3:
        this.x = (DISPLAY_WIDTH - 6 * TILE_WIDTH) / 2;
        this.y = DISPLAY_HEIGHT / 2 - TILE_WIDTH * 3;
        break;
    }

    this.angle = 360 - this.actor * 90;
  }

  updateChildren() {
    for (let i = 0; i < this.children.length; i++) {
      let tile = null;

      if (i >= this.discards.length) {
        tile = -1;
      } else {
        tile = this.discards[i];
      }

      const sprite = this.children[i];

      sprite.x = (i % 6) * TILE_WIDTH;
      sprite.y = Math.floor(i / 6) * TILE_HEIGHT;
      sprite.tile = tile;
      sprite.update();
    }
  }

}

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