export const WINDOW_WIDTH = 1280;
export const WINDOW_HEIGHT = 720;

export const DISPLAY_WIDTH = 640;
export const DISPLAY_HEIGHT = 640;

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 45;

export const GAME_INFO_WIDTH = 6 * TILE_WIDTH + TILE_HEIGHT;
export const GAME_INFO_HEIGHT = 6 * TILE_WIDTH + TILE_HEIGHT;

export const GAME_INFO_TEXT_STYLE = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Courier New',
  fontWeight: 'bold'
});

export const VOICE_TEXT_STYLE = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Courier New',
  fontWeight: 'bold',
  fontSize: 60,
  stroke: 'black',
  strokeThickness: 6
});


export const CALL_TYPE_TO_CALL_VOICE = {
  'chi': 3,
  'pon': 4,
  'minkan': 5,
  'kakan': 5,
  'ankan': 5,
};

export const WIND_ROTATION_TEXT = ['東', '南', '西', '北'];
export const VOICE_TEXT = ['リーチ', 'ロン', 'ツモ', 'チー', 'ポン', 'カン'];

export const REPEAT_INITIAL_TICK = 300;
export const REPEAT_TICK = 50;