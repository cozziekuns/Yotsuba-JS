const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 720;

const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 640;

const TILE_WIDTH = 32;
const TILE_HEIGHT = 45;

const GAME_INFO_WIDTH = 6 * TILE_WIDTH + TILE_HEIGHT;
const GAME_INFO_HEIGHT = 6 * TILE_WIDTH + TILE_HEIGHT;

const GAME_INFO_TEXT_STYLE = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Courier New',
  fontWeight: 'bold'
});

const WIND_ROTATION_TEXT = ['東', '南', '西', '北'];

const REPEAT_INITIAL_TICK = 300;
const REPEAT_TICK = 50;