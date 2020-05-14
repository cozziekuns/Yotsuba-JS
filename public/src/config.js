export const WINDOW_WIDTH = Math.max(window.innerWidth - 16, 1200);
export const WINDOW_HEIGHT =  Math.max(window.innerHeight - 16, 800);

export const DISPLAY_WIDTH = Math.max(window.innerHeight - 32, 784);
export const DISPLAY_HEIGHT = Math.max(window.innerHeight - 32, 784);

export const TILE_WIDTH = 44;
export const TILE_HEIGHT = 60;

export const GAME_INFO_WIDTH = 5 * TILE_WIDTH + TILE_HEIGHT;
export const GAME_INFO_HEIGHT = 5 * TILE_WIDTH + TILE_HEIGHT;

export const GAME_INFO_TEXT_STYLE = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Arial',
  fontWeight: 'bold'
});

export const GAME_INFO_TEXT_POINT_SIZE = 28;
export const GAME_INFO_TEXT_ROUND_SIZE = 36;
export const GAME_INFO_TEXT_WALL_SIZE = 20;
export const GAME_INFO_TEXT_BONUS_SIZE = 20;

export const VOICE_TEXT_STYLE = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSize: 96,
  stroke: 'black',
  strokeThickness: 8
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

export const TEDASHI_TINT = 0xA0A0A0;
