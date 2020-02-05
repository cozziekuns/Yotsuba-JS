//=============================================================================
// ** TileSprite
//=============================================================================

class TileSprite extends PIXI.Sprite {

  constructor(tile) {
    super();
    this.tile = tile;
  }

  textureFilename() {
    let prefix = ''

    // TODO: turn this into a real util function
    const tileValue = (Math.floor((this.tile % 36) / 9) + 1);
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
        prefix = suits[Math.floor(this.tile / 36)]
        prefix += tileValue;
        break;
    }

    return prefix + '.png';
  }

  update() {
    this.texture = PIXI.loader.resources['img/' + this.textureFilename()].texture
  }

}