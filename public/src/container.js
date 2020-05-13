import * as Config from './config.js';
import { Sprite_Tile } from './sprite.js';

//=============================================================================
// ** Container_Hand
//=============================================================================

export class Container_Hand extends PIXI.Container {

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
    this.x = (Config.DISPLAY_WIDTH - 14 * Config.TILE_WIDTH) / 2;
    this.y = (Config.DISPLAY_HEIGHT - Config.TILE_HEIGHT);

    switch (this.index) {
      case 0:
        this.x = (Config.DISPLAY_WIDTH - 14 * Config.TILE_WIDTH) / 2;
        this.y = Config.DISPLAY_HEIGHT - Config.TILE_HEIGHT;
        break;
      case 1:
        this.x = Config.DISPLAY_WIDTH - Config.TILE_HEIGHT;
        this.y = (Config.DISPLAY_WIDTH + 14 * Config.TILE_WIDTH) / 2;
        break;
      case 2:
        this.x = (Config.DISPLAY_WIDTH + 14 * Config.TILE_WIDTH) / 2;
        this.y = Config.TILE_HEIGHT;
        break;
      case 3:
        this.x = Config.TILE_HEIGHT;
        this.y = (Config.DISPLAY_WIDTH - 14 * Config.TILE_WIDTH) / 2;
        break;
    }

    this.angle = 360 - this.index * 90;
  }

  updateChildren() {
    this.children.forEach((sprite, index) => {
      sprite.x = index * Config.TILE_WIDTH;
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

export class Container_Call extends PIXI.Container {

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
        this.x = Config.DISPLAY_WIDTH;
        this.y = Config.DISPLAY_HEIGHT;
        break;
      case 1:
        this.x = Config.DISPLAY_WIDTH;
        this.y = 0;
        break;
      case 2:
        this.x = 0;
        this.y = 0;
        break;
      case 3:
        this.x = 0;
        this.y = Config.DISPLAY_HEIGHT
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
      const calleeRel = (4 + call.target - this.actor.index) % 4;
      const tileIndex = -1 * (calleeRel - 3);

      call.mentsu.slice().reverse().forEach((tile, index) => {
        const sprite = this.children[currIndex];

        if (index === (2 - tileIndex)) {
          sprite.x = currPosX - Config.TILE_HEIGHT;
          sprite.y = 0;
          sprite.angle = 270;
          currPosX -= Config.TILE_HEIGHT;
        } else {
          sprite.x = currPosX - Config.TILE_WIDTH;
          sprite.y = -Config.TILE_HEIGHT
          sprite.angle = 0;
          currPosX -= Config.TILE_WIDTH;
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

export class Container_Discard extends PIXI.Container {

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
        this.x = (Config.DISPLAY_WIDTH - Config.GAME_INFO_WIDTH) / 2;
        this.y = (Config.DISPLAY_HEIGHT + Config.GAME_INFO_HEIGHT) / 2;
        break;
      case 1:
        this.x = (Config.DISPLAY_WIDTH + Config.GAME_INFO_WIDTH) / 2;
        this.y = (Config.DISPLAY_HEIGHT + Config.GAME_INFO_HEIGHT) / 2;
        break;
      case 2:
        this.x = (Config.DISPLAY_WIDTH + Config.GAME_INFO_WIDTH) / 2;
        this.y = (Config.DISPLAY_HEIGHT - Config.GAME_INFO_HEIGHT) / 2;
        break;
      case 3:
        this.x = (Config.DISPLAY_WIDTH - Config.GAME_INFO_WIDTH) / 2;
        this.y = (Config.DISPLAY_HEIGHT - Config.GAME_INFO_HEIGHT) / 2;
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

      sprite.x = column * Config.TILE_WIDTH;
      sprite.y = row * Config.TILE_HEIGHT;
      sprite.angle = 0;

      if (i === this.actor.riichiIndex) {
        sprite.angle = 90;
        sprite.x += Config.TILE_HEIGHT;
      } else if (
        i > this.actor.riichiIndex
        && Math.floor(this.actor.riichiIndex / 6) === row
      ) {
        sprite.x += Config.TILE_HEIGHT - Config.TILE_WIDTH;
      }

      sprite.update();
    }
  }

}

//=============================================================================
// ** Container_RoundInfo
//=============================================================================

export class Container_RoundInfo extends PIXI.Container {

  constructor(round, actors) {
    super();
    this.round = round;
    this.actors = actors;
    this.perspective = 0;

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
    this.x = (Config.DISPLAY_WIDTH - Config.GAME_INFO_WIDTH) / 2;
    this.y = (Config.DISPLAY_HEIGHT - Config.GAME_INFO_HEIGHT) / 2;
  }

  createBackgroundSprite() {
    // TODO: Store this in a Sprite instead of using a Graphics object
    const backgroundGraphic = new PIXI.Graphics();

    backgroundGraphic.beginFill(0x333333);

    backgroundGraphic.drawRect(
      0,
      0,
      Config.GAME_INFO_WIDTH,
      Config.GAME_INFO_HEIGHT
    );

    backgroundGraphic.endFill();

    this.addChild(backgroundGraphic);
  }

  createRiichiSprites() {
    this.riichiSprites = [];

    for (let i = 0; i < 4; i++) {
      const riichiSprite = new PIXI.Sprite.from(
        // TODO: Put this somewhere real
        PIXI.Loader.shared.resources['img/tennbou-001.png'].texture
      );

      if (i % 2 === 0) {
        const yOff = (i == 0 ? Config.GAME_INFO_HEIGHT - riichiSprite.width : 0);

        riichiSprite.x = (Config.GAME_INFO_WIDTH - riichiSprite.height) / 2;
        riichiSprite.y = riichiSprite.width + yOff;
      } else {
        riichiSprite.x = (i == 1 ? Config.GAME_INFO_HEIGHT - riichiSprite.width : 0);
        riichiSprite.y = (Config.GAME_INFO_WIDTH - riichiSprite.height) / 2;
      }

      riichiSprite.angle = (i % 2 == 0 ? 270 : 0);
      riichiSprite.visible = false;

      this.riichiSprites.push(riichiSprite);
      this.addChild(riichiSprite);
    }
  }

  createPointsSprites() {
    const style = Config.GAME_INFO_TEXT_STYLE;
    style.fontSize = Config.GAME_INFO_TEXT_POINT_SIZE;

    this.pointsSprites = [];

    for (let i = 0; i < 4; i++) {
      const pointSprite = new PIXI.Text('', style);
      pointSprite.angle = 360 - i  * 90;

      this.pointsSprites.push(pointSprite);
      this.addChild(pointSprite);
    }
  }

  createRoundSprite() {
    const style = Config.GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = Config.GAME_INFO_TEXT_ROUND_SIZE;

    this.roundSprite = new PIXI.Text('', style);
    this.addChild(this.roundSprite);
  }

  createWallSprite() {
    const style = Config.GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = Config.GAME_INFO_TEXT_WALL_SIZE;

    this.wallSprite = new PIXI.Text('', style);
    this.addChild(this.wallSprite);
  }

  createBonusSprite() {
    const style = Config.GAME_INFO_TEXT_STYLE.clone();
    style.fontSize = Config.GAME_INFO_TEXT_BONUS_SIZE;

    this.bonusSprite = new PIXI.Text('', style);
    this.addChild(this.bonusSprite);
  }

  createDoraSprites() {
    this.doraSprites = [];

    for (let i = 0; i < 5; i++) {
      const doraSprite = new Sprite_Tile(-2);
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
    this.updateBonusSprite();
    this.updateWallSprite();
    this.updateDoraSprites();
  }

  updateRiichiSprites() {
    this.actors.forEach((actor, index) => {
      const actorIndex = (index + this.perspective) % 4;

      this.riichiSprites[actorIndex].visible = (actor.riichiStep == 2);
    });
  }

  updatePointsSprites() {
    for (let index = 0; index < 4; index++) {
      const actor = this.actors[(index + this.perspective) % 4];

      const actorWind = this.round.getActorWind(actor.index);
      const windText = Config.WIND_ROTATION_TEXT[actorWind];

      const pointSprite = this.pointsSprites[index];
      pointSprite.text = windText + '：' + actor.points;

      if (index % 2 == 0) {
        pointSprite.x = (Config.GAME_INFO_WIDTH + (index == 0 ? -pointSprite.width : pointSprite.width)) / 2;
        pointSprite.y = (index == 0 ? Config.GAME_INFO_HEIGHT - pointSprite.height - 16 : pointSprite.height + 16);
      } else {
        pointSprite.x = (index == 1 ? Config.GAME_INFO_HEIGHT - pointSprite.height - 16 : pointSprite.height + 16);
        pointSprite.y = (Config.GAME_INFO_WIDTH + (index == 3 ? -pointSprite.width : pointSprite.width)) / 2;
      }
    }
  }

  updateRoundSprite() {
    const rotationText = ['１','２','３','４'];

    const wind = Math.floor(this.round.round / 4);
    const rotation = this.round.round % 4;

    const baseText = rotationText[rotation] + '局';

    this.roundSprite.text = Config.WIND_ROTATION_TEXT[wind] + baseText;
    this.roundSprite.x = (Config.GAME_INFO_WIDTH - this.roundSprite.width) / 2;
    this.roundSprite.y = Config.GAME_INFO_HEIGHT / 2 - 80;
  }

  updateWallSprite() {
    this.wallSprite.text = '山牌：' + this.round.tilesLeft;
    this.wallSprite.x = (Config.GAME_INFO_WIDTH - this.wallSprite.width) / 2;
    this.wallSprite.y = this.bonusSprite.y + this.bonusSprite.height + 12;
  }

  updateBonusSprite() {
    const hombaText = '本：' + this.round.homba;
    const riibouText = '棒：' + this.round.riibou;

    this.bonusSprite.text = hombaText + '　' + riibouText;
    this.bonusSprite.x = (Config.GAME_INFO_WIDTH - this.bonusSprite.width) / 2;
    this.bonusSprite.y = this.roundSprite.y + this.roundSprite.height + 8;
  }

  updateDoraSprites() {
    this.doraSprites.forEach((sprite, index) => {
      const baseX = (Config.GAME_INFO_WIDTH - (Config.TILE_WIDTH * 10 / 3)) / 2;
      sprite.x = baseX + index * (Config.TILE_WIDTH * 2 / 3);
      sprite.y = this.wallSprite.y + this.wallSprite.height + 12;

      sprite.tile = this.round.dora[index];
      sprite.update();
    });
  }

}
