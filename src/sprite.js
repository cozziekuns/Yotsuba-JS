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

    this.texture = PIXI.loader.resources['img/' + this.textureFilename()].texture;
  }

}

//=============================================================================
// ** Sprite_Voice
//=============================================================================

class Sprite_Voice extends PIXI.Text {

  constructor(index, actor) {
    super();
    this.index = index;
    this.actor = actor;
    this.style = VOICE_TEXT_STYLE;
  }

  update() {
    this.updateTextString()
    this.updateTextPosition();
  }

  updateTextString() {
    if (this.actor.voice >= 0) {
      this.text = VOICE_TEXT[this.actor.voice];
    } else {
      this.text = '';
    }
  }

  updateTextPosition() {
    switch(this.index) {
      case 0:
        this.x = (DISPLAY_WIDTH - this.width) / 2;
        this.y = DISPLAY_HEIGHT - 128;
        break;
      case 1:
        this.x = DISPLAY_WIDTH - 128;
        this.y = (DISPLAY_HEIGHT + this.width) / 2;
        break;
      case 2:
        this.x = (DISPLAY_WIDTH + this.width) / 2;
        this.y = 128;
        break;
      case 3:
        this.x = 128;
        this.y = (DISPLAY_HEIGHT - this.width) / 2;
        break;
    }

    this.angle = 360 - 90 * this.index;
  }

}

//=============================================================================
// ** Container_Hand
//=============================================================================

class Container_Hand extends PIXI.Container {

  constructor(index, actor) {
    super();
    this.index = index;
    this.actor = actor;

    this.createTileSprites();
  }

  createTileSprites() {
    for (let i = 0; i < 14; i++) {
      const tileSprite = new Sprite_Tile(-1);
      this.addChild(tileSprite);
    }
  }

  update() {
    this.updatePosition();
    this.updateChildren();
  }

  updatePosition() {
    this.x = (DISPLAY_WIDTH - 14 * TILE_WIDTH) / 2;
    this.y = (DISPLAY_HEIGHT - TILE_HEIGHT);

    switch (this.index) {
      case 0:
        this.x = (DISPLAY_WIDTH - 14 * TILE_WIDTH) / 2;
        this.y = DISPLAY_HEIGHT - TILE_HEIGHT;
        break;
      case 1:
        this.x = DISPLAY_WIDTH - TILE_HEIGHT;
        this.y = (DISPLAY_WIDTH + 14 * TILE_WIDTH) / 2;
        break;
      case 2:
        this.x = (DISPLAY_WIDTH + 14 * TILE_WIDTH) / 2;
        this.y = TILE_HEIGHT;
        break;
      case 3:
        this.x = TILE_HEIGHT;
        this.y = (DISPLAY_WIDTH - 14 * TILE_WIDTH) / 2;
        break;
    }

    this.angle = 360 - this.index * 90;
  }

  updateChildren() {
    this.children.forEach((sprite, index) => {
      sprite.x = index * TILE_WIDTH;
      sprite.tile = this.actor.hand.getTileAtIndex(index); 

      if (this.actor.hasDrawnTile && index == this.actor.hand.tiles.length - 1) {
        sprite.x += 4;
      }

      sprite.update();
    });
  }

}

//=============================================================================
// ** Container_Call
//=============================================================================

class Container_Call extends PIXI.Container {

  constructor(index, actor) {
    super();
    this.index = index;
    this.actor = actor;

    this.createCallSprites();
  }

  createCallSprites() {
    for (let i = 0; i < 16; i++) {
      const tileSprite = new Sprite_Tile(-1);
      this.addChild(tileSprite);
    }
  }

  update() {
    this.updatePosition();
    this.updateChildren();
  }

  updatePosition() {
    switch (this.index) {
      case 0:
        this.x = DISPLAY_WIDTH;
        this.y = DISPLAY_HEIGHT;
        break;
      case 1:
        this.x = DISPLAY_WIDTH;
        this.y = 0;
        break;
      case 2:
        this.x = 0;
        this.y = 0;
        break;
      case 3:
        this.x = 0;
        this.y = DISPLAY_HEIGHT
        break;
    }

    this.angle = 360 - this.index * 90;
  }

  updateChildren() {
    this.children.forEach(sprite => {
      sprite.tile = -1;
      sprite.update();
    });

    let currIndex = 0;
    let currPosX = 0;

    this.actor.hand.calls.forEach(call => {
      const callee_rel = (4 + call.target - this.actor.index) % 4;
      const tileIndex = -1 * (callee_rel - 3);

      call.mentsu.slice().reverse().forEach((tile, index) => {
        const sprite = this.children[currIndex];

        if (index === (2 - tileIndex)) {
          sprite.x = currPosX - TILE_HEIGHT;
          sprite.y = 0;
          sprite.angle = 270;
          currPosX -= TILE_HEIGHT;
        } else {
          sprite.x = currPosX - TILE_WIDTH;
          sprite.y = -TILE_HEIGHT
          sprite.angle = 0;
          currPosX -= TILE_WIDTH;
        } 

        sprite.tile = tile;
        sprite.update();
  
        currIndex += 1;
      });

    });
  }

}

//=============================================================================
// ** Container_Discard
//=============================================================================

class Container_Discard extends PIXI.Container {

  constructor(index, actor) {
    super();
    this.index = index;
    this.actor = actor;

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
    switch (this.index) {
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

    this.angle = 360 - this.index * 90;
  }

  updateChildren() {
    for (let i = 0; i < this.children.length; i++) {
      const sprite = this.children[i];

      let tile = null;

      if (i >= this.actor.discards.length) {
        tile = -1;
      } else {
        tile = this.actor.discards[i];
      }

      sprite.tile = tile;

      const row = Math.min(Math.floor(i / 6), 2);
      const column = (row === 2 ? i - 12 : i % 6);

      sprite.x = column * TILE_WIDTH;
      sprite.y = row * TILE_HEIGHT;
      sprite.angle = 0;

      if (i === this.actor.riichiIndex) {
        sprite.angle = 90;
        sprite.x += TILE_HEIGHT;
      } else if (
        i > this.actor.riichiIndex 
        && Math.floor(this.actor.riichiIndex / 6) === row
      ) {
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

  constructor(round, actors) {
    super();
    this.round = round;
    this.actors = actors;

    this.createBackgroundSprite();
    this.createPointsSprites();
    this.createRiichiSprites();
    this.createRoundSprite();
    this.createWallSprite();
    this.createBonusSprite();
    this.createDoraSprites();

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
        // TODO: Put this somewhere real
        PIXI.loader.resources['img/tennbou-001.png'].texture
      );

      if (i % 2 === 0) {
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
    const style = GAME_INFO_TEXT_STYLE;
    style.fontSize = 20;

    this.pointsSprites = [];

    for (let i = 0; i < 4; i++) {
      const pointSprite = new PIXI.Text('', style);

      if (i % 2 === 0) {
        pointSprite.x = GAME_INFO_WIDTH / 2 + (i == 0 ? -50 : 50);
        pointSprite.y = (i == 0 ? GAME_INFO_HEIGHT - 40 : 40);
      } else {
        pointSprite.x = (i == 1 ? GAME_INFO_HEIGHT - 40 : 40);
        pointSprite.y = GAME_INFO_WIDTH / 2 + (i == 1 ? 50 : -50);
      }

      pointSprite.angle = 360 - i  * 90;

      this.pointsSprites.push(pointSprite);
      this.addChild(pointSprite);
    }
  }

  createRoundSprite() {
    const style = GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = 24;

    this.roundSprite = new PIXI.Text('', style);
    this.roundSprite.x = GAME_INFO_WIDTH / 2 - 36;
    this.roundSprite.y = GAME_INFO_HEIGHT / 2 - 58;

    this.addChild(this.roundSprite);
  }

  createWallSprite() {
    const style = GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = 16;

    this.wallSprite = new PIXI.Text('', style);
    this.wallSprite.x = GAME_INFO_WIDTH / 2 - 34;
    this.wallSprite.y = GAME_INFO_HEIGHT / 2 - 20;

    this.addChild(this.wallSprite);
  }

  createBonusSprite() {
    const style = GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = 16;

    this.bonusSprite = new PIXI.Text('', style);
    this.bonusSprite.x = GAME_INFO_WIDTH / 2 - 46;
    this.bonusSprite.y = GAME_INFO_HEIGHT / 2 + 4;

    this.addChild(this.bonusSprite);
  }

  createDoraSprites() {
    this.doraSprites = [];

    for (let i = 0; i < 5; i++) {
      const doraSprite = new Sprite_Tile(-2);

      doraSprite.x = (GAME_INFO_WIDTH - (TILE_WIDTH * 10 / 3)) / 2 + i * (TILE_WIDTH * 2 / 3);
      doraSprite.y = GAME_INFO_HEIGHT / 2 + 32;
      doraSprite.scale.x = 0.67;
      doraSprite.scale.y = 0.67;

      this.doraSprites.push(doraSprite);
      this.addChild(doraSprite);
    }
  }

  update() {
    this.updatePointsSprites();
    this.updateRiichiSprites();
    this.updateRoundSprite();
    this.updateWallSprite();
    this.updateBonusSprite();
    this.updateDoraSprites();
  }

  updateRiichiSprites() {
    this.actors.forEach((actor, index) => {
      this.riichiSprites[index].visible = (actor.riichiStep == 2);
    });
  }

  updatePointsSprites() {
    this.actors.forEach((actor, index) => {
      const windText = WIND_ROTATION_TEXT[this.round.getActorWind(actor.index)];

      this.pointsSprites[index].text = windText + '：' + actor.points;
    });
  }

  updateRoundSprite() {
    const rotationText = ['１','２','３','４'];

    const wind = Math.floor(this.round.round / 4);
    const rotation = this.round.round % 4;

    this.roundSprite.text = WIND_ROTATION_TEXT[wind] + rotationText[rotation] + '局';
  }

  updateWallSprite() {
    this.wallSprite.text = '山牌：' + this.round.tilesLeft;
  }

  updateBonusSprite() {
    this.bonusSprite.text = '本：' + this.round.homba + ' 棒：' + this.round.riibou;
  }

  updateDoraSprites() {
    this.doraSprites.forEach((sprite, index) => {
      sprite.tile = this.round.dora[index];
      sprite.update();
    });
  }

}