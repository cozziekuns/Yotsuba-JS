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
    // TODO: Move this somewhere???
    const style = new PIXI.TextStyle({
      fill: 'white',
      fontFamily: 'Courier New',
      fontSize: 20,
      fontWeight: 'bold'
    });

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
    const style = new PIXI.TextStyle({
      fill: 'white',
      fontFamily: 'Courier New',
      fontSize: 24,
      fontWeight: 'bold'
    });

    const roundSprite = new PIXI.Text('東１局', style);
    roundSprite.x = GAME_INFO_WIDTH / 2 - 36;
    roundSprite.y = GAME_INFO_HEIGHT / 2 - 54;

    this.addChild(roundSprite);
  }

  createWallSprite() {
    const style = new PIXI.TextStyle({
      fill: 'white',
      fontFamily: 'Courier New',
      fontSize: 16,
      fontWeight: 'bold'
    });

    this.wallSprite = new PIXI.Text('山牌：54', style);
    this.wallSprite.x = GAME_INFO_WIDTH / 2 - 34;
    this.wallSprite.y = GAME_INFO_HEIGHT / 2 - 16;

    this.addChild(this.wallSprite);
  }

  createBonusSprite() {
    const style = new PIXI.TextStyle({
      fill: 'white',
      fontFamily: 'Courier New',
      fontSize: 16,
      fontWeight: 'bold'
    });

    this.bonusSprite = new PIXI.Text('本：0 棒：0', style);
    this.bonusSprite.x = GAME_INFO_WIDTH / 2 - 46;
    this.bonusSprite.y = GAME_INFO_HEIGHT / 2 + 8;

    this.addChild(this.bonusSprite);
  }

  createDoraSprites() {
    this.doraSprites = [];

    for (let i = 0; i < 5; i++) {
      const doraSprite = new Sprite_Tile(-2);

      doraSprite.x = (GAME_INFO_WIDTH - (TILE_WIDTH * 10 / 3)) / 2 + i * (TILE_WIDTH * 2 / 3);
      doraSprite.y = GAME_INFO_HEIGHT / 2 + 36;
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
    this.round.riichiSteps.forEach((step, actor) => {
      this.riichiSprites[actor].visible = (step == 2);
    });
  }

  updatePointsSprites() {
    // TODO: Move this somewhere
    const actorText = ['東', '南', '西', '北'];

    this.round.points.forEach((points, actor) => {
      const windText = actorText[this.round.getActorWind(actor)];

      this.pointsSprites[actor].text = windText + '：' + points;
    });
  }

  updateRoundSprite() {

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