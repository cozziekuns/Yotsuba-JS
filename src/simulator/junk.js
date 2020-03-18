import { SimulationAdapter } from './simulate.js';
import { Util } from './util.js';

const handPlayer = Util.getHandFromString('45566m34556p567s');
const handOpp = Util.getHandFromString('456m12388p55667s');
const handOpp2 = Util.getHandFromString('337m6778p334678s');
const handOpp3 = Util.getHandFromString('5678m569p11289s3z');

const payload = {}
payload.wall = new Array(34).fill(4);
payload.wallTiles = 134;

payload.hands = [handPlayer, handOpp2, handOpp3, handOpp];
payload.hands.forEach(hand => {
  hand.forEach(tile => {
    payload.wall[tile] -= 1;
    payload.wallTiles -= 1;
  })
});

const adapter = new SimulationAdapter();
adapter.processGameState(payload);
console.log(adapter.simulateGameState([0, 3], 20, 0));

/*

//=============================================================================
// ** Main
//=============================================================================

const wall = new Array(34).fill(4);

// 378m 2378p 123789s
// let handPlayer = [2, 6, 7, 10, 11, 15, 16, 18, 19, 20, 24, 25, 29];

// 23m 2256p 1888999s
// let handOpp = [1, 2, 11, 11, 15, 16, 17, 25, 25, 25, 26, 26, 26];

// 2223334445589m
// const handPlayer = [1, 1, 9, 10, 16, 17, 18, 25, 25, 25, 26, 26, 26];
// const handOpp = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 22, 23];

// 23m22233344455p
// const handOpp = [1, 2, 10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13];

const handPlayer = getHandFromString('45566m34556p567s');
const handOpp = getHandFromString('456m12388p55667s');

const playerWall = wall.slice();
const oppWall = wall.slice();

handPlayer.forEach(tile => {
  wall[tile] -= 1; 
  playerWall[tile] -= 1;
});

handOpp.forEach(tile => {
  wall[tile] -= 1;
  oppWall[tile] -= 1;
});

const configurationsPlayer = calcMentsuConfigurations(handPlayer);
const minShantenConfigurationsPlayer = getMinShantenConfigurations(configurationsPlayer);

const configurationsOpp = calcMentsuConfigurations(handOpp);
const minShantenConfigurationsOpp = getMinShantenConfigurations(configurationsOpp);

const configurationPlayer = new ConfigurationNode(minShantenConfigurationsPlayer);
const configurationOpp = new ConfigurationNode(minShantenConfigurationsOpp);

const wallTiles = 110;

const drawsLeft = 20;
const currentPlayer = 0;

// Warm-up Configurations
simulateHitori(
  playerWall,
  wallTiles,  
  configurationPlayer,
  0,
  18,
  new WeakMap(),
);

simulateHitori(
  oppWall,
  wallTiles,
  configurationOpp,
  0,
  18,
  new WeakMap(),
)

const gameStateNode = new GameStateNode([configurationPlayer, configurationOpp]);

let hrStart = process.hrtime();

console.log(simulateGameState(
  wall,
  wallTiles,
  gameStateNode,
  drawsLeft,
  0,
  new WeakMap(),
));

let hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);

hrStart = process.hrtime();
console.log(simulateBlackBoxShoubu(
  wall,
  wallTiles,
  configurationPlayer,
  6,
  drawsLeft,
  0,
  new WeakMap(),
));
hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);

*/