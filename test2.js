/* TODO List:
  - Customizable Dora
  - Chiitoi and Kokushi
  - Clean up code, turn it into a library
*/


//----------------------------------------------------------------------------
// ** Utility Methods
//----------------------------------------------------------------------------

function addToBucketMap(bucketMap, key, value) {
  if (!bucketMap.has(key)) {
    bucketMap.set(key, []);
  }

  bucketMap.get(key).push(value);
}

function tileValue(tile) {
  return ((tile < 0 || tile >= 27) ? 10 : (tile % 9 + 1));
}

function getOutsForShape(shape) {
  const outs = [];

  if (shape.length === 1) {
    // Tanki
    for (let i = -2; i <= 2; i++) {
      if (tileValue(shape[0] + i) === tileValue(shape) + i) {
        outs.push(shape[0] + i);
      }
    }
  } else if (shape.length === 2) {
    if (shape[0] === shape[1]) {
      // Toitsu
      outs.push(shape[0]);
    } else if (shape[0] === shape[1] - 1) {
      // Ryanmen / Penchan
      if (tileValue(shape[0]) > 1) {
        outs.push(shape[0] - 1);
      }

      if (tileValue(shape[1]) < 9) {
        outs.push(shape[1] + 1);
      }
    } else if (shape[0] === shape[1] - 2) {
      // Kanchan
      outs.push(shape[0] + 1);
    }
  }

  return outs;
}

//=============================================================================
// ** ConfigurationNode
//=============================================================================

class ConfigurationNode {

  constructor(configurationList) {
    this.configurationList = configurationList;
    this.shanten = calculateConfigurationShanten(configurationList[0]);

    this.outs = [];
    this.outsMapList = [];
    this.children = new Map();

    this.calculateOutsMapList();
    this.calculateOuts();
    this.spawnChildren();
  }

  //--------------------------------------------------------------------------
  // * Ukeire Calculation
  //--------------------------------------------------------------------------

  calculateOuts() {
    const outs = this.outsMapList.reduce(
      (total, outsMap) => total = total.concat(Array.from(outsMap.keys())),
      [],
    );

    this.outs = [...new Set(outs)];
  }

  calculateOutsMapList() {
    this.outsMapList = this.configurationList.map(
      configuration => this.getOutsMapForConfiguration(configuration)
    );
  }
    
  getOutsMapForConfiguration(configuration) {
    const outsMap = new Map();
  
    const atamaCandidates = configuration.filter(
      shape => shape.length === 2 && shape[0] === shape[1]
    );
  
    const mentsu = configuration.filter(shape => shape.length === 3);
    const taatsu = configuration.filter(shape => shape.length === 2);
    const floatTiles = configuration.filter(shape => shape.length === 1);
  
    if (atamaCandidates.length === 1) {
      taatsu.splice(taatsu.indexOf(atamaCandidates[0]), 1);
    }
  
    taatsu.forEach(shape => {
      getOutsForShape(shape).forEach(
        tile => addToBucketMap(outsMap, tile, shape)
      );
    });
    
    if (mentsu.length + taatsu.length === 4 && atamaCandidates.length === 0) {
      // When we have four blocks but no atama, floats becoming atama
      // decreases shanten.
      floatTiles.forEach(shape => addToBucketMap(outsMap, shape[0], shape));
    } else if (mentsu.length + taatsu.length < 4) {
      floatTiles.forEach(shape => {
        getOutsForShape(shape).forEach(
          tile => addToBucketMap(outsMap, tile, shape)
        );
      });
    }

    return outsMap;
  }

  //--------------------------------------------------------------------------
  // * Spawn Children Nodes
  //--------------------------------------------------------------------------

  calculateConfigurationListForOut(configuration, outsMap, out) {
    outsMap.get(out).forEach(shape => {
      const newConfiguration = configuration.slice();

      newConfiguration.splice(newConfiguration.indexOf(shape), 1);
      newConfiguration.push(shape.concat(out).sort((a, b) => a - b));

      const tilesToRemove = newConfiguration.filter(shape => shape.length === 1);
      const blocks = newConfiguration.filter(shape => shape.length > 1);
      
      if (blocks.length === 5) {
        const tile = tilesToRemove[0];

        newConfiguration.splice(newConfiguration.indexOf(tile), 1);
        addToBucketMap(this.children.get(out), tile[0], newConfiguration);
      } else {
        tilesToRemove.forEach(tile => {
          const configurationWithoutTile = newConfiguration.slice();
          configurationWithoutTile.splice(configurationWithoutTile.indexOf(tile), 1);

          addToBucketMap(this.children.get(out), tile[0], configurationWithoutTile);
        });
      }
    });
  }

  spawnChildren() {
    if (this.shanten === 0) {
      return;
    }

    this.outs.forEach(out => this.children.set(out, new Map()));

    this.configurationList.forEach((configuration, index) => {
      const outsMap = this.outsMapList[index];

      for (let out of outsMap.keys()) {
        this.calculateConfigurationListForOut(configuration, outsMap, out);
      }
    });

    this.children.forEach(childForOut => {
      childForOut.forEach((configurationList, tileToRemove) => {
        childForOut.set(tileToRemove, new ConfigurationNode(configurationList));
      });
    });
  }

}

//----------------------------------------------------------------------------
// * Mentsu Configuration Methods
//----------------------------------------------------------------------------

function calcMentsuConfigurations(hand) {
  let queue = [[hand, [], 0, false]];

  while (queue.length > 0) {
    const nextElement = queue.shift();

    const currentHand = nextElement[0];
    const oldHand = nextElement[1];
    const mentsu = nextElement[2];
    const hasAtama = nextElement[3];

    if (currentHand.length === 0) {
      return [oldHand].concat(
        queue
          .filter(element => element[0].length === 0)
          .map(element => element[1])
      );
    }

    if (currentHand.length > 2 && mentsu < 4) {
      // Kootsu
      if (currentHand[0] === currentHand[1] && currentHand[1] === currentHand[2]) {
        queue.push([
          currentHand.slice(3, currentHand.length),
          oldHand.concat([currentHand.slice(0, 3)]),
          mentsu + 1,
          hasAtama,
        ]);
      }

      // Shuntsu
      if (tileValue(currentHand[0]) < 8) {
        if (
          currentHand.includes(currentHand[0] + 1) && 
          currentHand.includes(currentHand[0] + 2)
        ) {
          const newHand = currentHand.slice(1, currentHand.length);
          newHand.splice(newHand.indexOf(currentHand[0] + 1), 1);
          newHand.splice(newHand.indexOf(currentHand[0] + 2), 1);

          const shuntsu = [currentHand[0], currentHand[0] + 1, currentHand[0] + 2];
          queue.push([newHand, oldHand.concat([shuntsu]), mentsu + 1, hasAtama]);
        }

      }
    }

    if (currentHand.length > 1) {
      // Toitsu
      if (currentHand[0] === currentHand[1] && (!hasAtama || mentsu < 4)) {
        queue.push([
          currentHand.slice(2, currentHand.length),
          oldHand.concat([currentHand.slice(0, 2)]),
          (hasAtama ? mentsu + 1 : mentsu),
          true,
        ]);
      }

      if (mentsu < 4) {
        // Ryanmen / Penchan
        if (tileValue(currentHand[0]) < 9 && currentHand.includes(currentHand[0] + 1)) {
          const newHand = currentHand.slice(1, currentHand.length);
          newHand.splice(newHand.indexOf(currentHand[0] + 1), 1);

          const taatsu = [currentHand[0], currentHand[0] + 1];
          queue.push([newHand, oldHand.concat([taatsu]), mentsu + 1, hasAtama]);
        }

        // Kanchan
        if (tileValue(currentHand[0]) < 8 && currentHand.includes(currentHand[0] + 2)) {
          const newHand = currentHand.slice(1, currentHand.length);
          newHand.splice(newHand.indexOf(currentHand[0] + 2), 1);

          const taatsu = [currentHand[0], currentHand[0] + 2];
          queue.push([newHand, oldHand.concat([taatsu]), mentsu + 1, hasAtama]);
        }
      }
    }

    // Tanki
    queue.push([
      currentHand.slice(1, currentHand.length),
      oldHand.concat([currentHand.slice(0, 1)]),
      mentsu,
      hasAtama,
    ]);
  }

  throw 'Invalid input.';
}

//----------------------------------------------------------------------------
// * Shanten Calculation
//----------------------------------------------------------------------------

function calculateConfigurationShanten(configuration) {
  const blocks = configuration.filter(shape => shape.length > 1);

  return 8 - blocks.reduce((a, b) => a + b.length - 1, 0);
}

function getMinShantenConfigurations(configurations) {
  const configurationShanten = configurations.map(
    configuration => calculateConfigurationShanten(configuration)
  );

  const shanten = Math.min(...configurationShanten);

  return configurations.filter(
    (_, index) => configurationShanten[index] === shanten
  );
}

let b = 0;

//-----------------------------------------------------------------------------
// * Simulate Hands
//-----------------------------------------------------------------------------

function calcDrawChance(wallTiles, ukeire, drawsLeft) {
  let ryuukyokuChance = 1;

  for (let i = 0; i < drawsLeft; i++) {
    ryuukyokuChance *= wallTiles - ukeire - i;
    ryuukyokuChance /= wallTiles - i;
  }

  return 1 - ryuukyokuChance;
}

function simulate(
  wall,
  wallTiles,
  configurationNode,
  endShanten,
  drawsLeft,
) {
  if (configurationNode.shanten - endShanten > drawsLeft) {
    return 0;
  }

  if (memo.has(configurationNode)) {
    const drawsLeftTable = memo.get(configurationNode);

    if (drawsLeftTable[drawsLeft] >= 0) {
      return drawsLeftTable[drawsLeft];
    }
  } else {
    // TODO: Set this to something like: MAX_DRAWS_LEFT
    const drawsLeftTable = new Array(18).fill(-1);

    memo.set(configurationNode, drawsLeftTable);
  }

  const ukeire = configurationNode.outs.reduce(
    (total, out) => total + wall[out],
    0,
  );
  
  if (configurationNode.shanten === endShanten) {
    return calcDrawChance(wallTiles, ukeire, drawsLeft);
  }

  const drawChance = calcDrawChance(wallTiles, ukeire, 1);
  
  let agariChance = (1 - drawChance) * simulate(
    wall,
    wallTiles - 1,
    configurationNode,
    endShanten,
    drawsLeft - 1,
  );

  for (let i = 0; i < configurationNode.outs.length; i++) {
    const out = configurationNode.outs[i];

    if (wall[out] === 0) {
      continue;
    }

    const newWall = wall.slice();
    newWall[out] -= 1;

    let newAgariChance = -1;

    configurationNode.children.get(out).forEach(
      newConfigurationNode => {
        const newConfigurationNodeAgariChance = simulate(
          newWall,
          wallTiles - 1,
          newConfigurationNode,
          endShanten,
          drawsLeft - 1,
        );

        if (newConfigurationNodeAgariChance > newAgariChance) {
          newAgariChance = newConfigurationNodeAgariChance;
        }
      }
    );

    agariChance += (wall[out] / ukeire) * newAgariChance * drawChance;
  }

  memo.get(configurationNode)[drawsLeft] = agariChance;

  return agariChance;
}

//=============================================================================
// ** Main
//=============================================================================

const wall = new Array(34).fill(4);

// 378m 2378p 123789s
let hand = [2, 6, 7, 10, 11, 15, 16, 18, 19, 20, 24, 25, 26];

// 22m 2356p 1888999s
// let hand = [1, 1, 10, 11, 13, 14, 18, 25, 25, 25, 26, 26, 26];

// 22m 23356p 888999s
// let hand = [1, 1, 10, 11, 11, 13, 14, 25, 25, 25, 26, 26, 26];

hand.forEach(tile => wall[tile] -= 1);

const configurations = calcMentsuConfigurations(hand);
const minShantenConfigurations = getMinShantenConfigurations(configurations);

const configuration = new ConfigurationNode(minShantenConfigurations);

// Global Memo object
let memo = new WeakMap();

const drawsLeft = 18;
const wallTiles = 123;
  
const hrStart = process.hrtime();

simulate(wall, wallTiles, configuration, 0, drawsLeft);

const hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);

console.log(memo.get(configuration));

// Clear the memo after we're done with it
memo = undefined;