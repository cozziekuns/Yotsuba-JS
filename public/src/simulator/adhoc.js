import { ConfigurationUtil, Util } from './util.js'
import { Simulator } from './simulate.js';
import { ConfigurationNode } from './nodes.js';

console.log('hewoooo');

const hand = Util.getHandFromString('3456777m1188p79s');

const wall = new Array(34).fill(4);
const wallTiles = 117;

hand.forEach(tile => wall[tile] -= 1);

console.log(hand);

const mentsuConfigurations = ConfigurationUtil.calcMentsuConfigurations(hand);

const configurationList = ConfigurationUtil.getMinShantenConfigurations(
  mentsuConfigurations,
);

const configurationNode = new ConfigurationNode(
  configurationList,
  new Map(),
);

const result = Simulator.simulateHitori(
  wall,
  wallTiles,
  configurationNode,
  0,
  18 - 5, 
  new WeakMap(),
);

console.log(result);