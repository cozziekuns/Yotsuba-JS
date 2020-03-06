// TODO: Clean up all the methods now that we're 4 groups + 1 pair.

//----------------------------------------------------------------------------
// * Utility Methods
//----------------------------------------------------------------------------

function flattenConfiguration(configuration) {
  const result = [];

  configuration.forEach(shape => result.push(...shape));

  return result;
}

function addToBucketMap(bucketMap, key, value) {
  if (!(key in bucketMap)) {
    bucketMap[key] = [];
  }

  bucketMap[key].push(value);
}

function tileValue(tile) {
  return ((tile < 0 || tile >= 27) ? 10 : (tile % 9 + 1));
}

function getAtamaFromConfiguration(configuration) {
  let atama = undefined; 

  for (let i = 0; i < configuration.length; i++) {
    const shape = configuration[i];

    if (shape.length === 2 && shape[0] === shape[1]) {
      atama = shape;
      break;
    } else if (shape.length === 1) {
      atama = shape;
    }
  }

  return atama;
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

//-----------------------------------------------------------------------------
// * Shanten Methods
//-----------------------------------------------------------------------------

function calcConfigurationShanten(configuration) {
  const atama = getAtamaFromConfiguration(configuration);

  const configurationWithoutAtama = configuration.slice();
  configurationWithoutAtama.splice(configuration.indexOf(atama), 1);

  const shapesToUse = configurationWithoutAtama.sort(
    (a, b) => b.length - a.length
  ).slice(0, 4);

  return 9 - atama.length - shapesToUse.reduce((a, b) => a + b.length - 1, 0);
}

function getMinShantenConfigurations(configurations) {
  const configurationShanten = configurations.map(
    configuration => calcConfigurationShanten(configuration)
  );

  const shanten = Math.min(...configurationShanten);

  return configurations.filter(
    (_, index) => configurationShanten[index] === shanten
  );
}

//-----------------------------------------------------------------------------
// * Ukeire Methods
//-----------------------------------------------------------------------------

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

function getLowestUkeireShape(shapes, wall) {
  const shapeUkeireList = [];

  shapes.forEach(shape => {
    const outs = getOutsForShape(shape);

    shapeUkeireList.push(
      outs.reduce((total, out) => total += wall[out], 0)
    );
  });

  const index = shapeUkeireList.indexOf(Math.min(...shapeUkeireList));

  return shapes[index];
}

function removeUnusedTile(configuration, wall) {
  const blocks = configuration.filter(shape => shape.length > 1);
  const floatTiles = configuration.filter(shape => shape.length === 1);

  const atamaCandidates = blocks.filter(
    shape => shape.length === 2 && shape[0] === shape[1]
  );

  let shapeToRemove = undefined;

  if (blocks.length > 4) {
    shapeToRemove = floatTiles[0];
  } else if (blocks.length === 4 && atamaCandidates.length === 0) {
    // If we don't have an atama, remove the float that gives us the
    // least toitsu outs.
    const floatTilesInWall = floatTiles.map(shape => wall[shape[0]]);
    const index = floatTilesInWall.indexOf(Math.min(...floatTilesInWall));

    shapeToRemove = floatTiles[index];
  } else {
    shapeToRemove = getLowestUkeireShape(floatTiles, wall);
  }

  configuration.splice(configuration.indexOf(shapeToRemove), 1);
}

function getOutsFromOutsMapList(outsMapList) {
  const outs = outsMapList.reduce(
    (a, b) => a = a.concat(Object.keys(b).map(key => Number(key))),
    [],
  );

  return [...new Set(outs)];
}
  
function getOutsMapForConfiguration(configuration) {
  const outsMap = {};

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
    getOutsForShape(shape).forEach(tile => addToBucketMap(outsMap, tile, shape));
  });
  
  if (mentsu.length + taatsu.length === 4 && atamaCandidates.length === 0) {
    // When we have four blocks but no atama, floats becoming atama
    // decreases shanten.
    floatTiles.forEach(shape => addToBucketMap(outsMap, shape[0], shape));
  } else if (mentsu.length + taatsu.length < 4) {
    floatTiles.forEach(shape => {
      getOutsForShape(shape).forEach(tile => addToBucketMap(outsMap, tile, shape));
    });
  }

  return outsMap;
}

function getNewConfigurationsForOut(configuration, outsMap, wall, tile) {;
  const configurations = [];

  outsMap[tile].forEach(shape => {
    const newConfiguration = configuration.slice();

    newConfiguration.splice(newConfiguration.indexOf(shape), 1);
    newConfiguration.push(shape.concat([tile]).sort((a, b) => a - b));
    removeUnusedTile(newConfiguration, wall);

    configurations.push(newConfiguration);
  });

  return configurations;
}

function getNewConfigurationListForOut(configurationList, outsMapList, wall, out) {
  const newConfigurations = [];

  configurationList.forEach((configuration, index) => {
    const outsMap = outsMapList[index];

    if (outsMap[out]) {
      newConfigurations.push(
        ...getNewConfigurationsForOut(configuration, outsMap, wall, out)
      );
    }
  });

  return newConfigurations;
}

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

// TODO: Work out 
function simulate(
  wall,
  wallTiles,
  configurationList,
  shanten,
  endShanten,
  drawsLeft,
) {
  if (shanten - endShanten > drawsLeft) {
    return 0;
  }

  const outsMapList = configurationList.map(
    configuration => getOutsMapForConfiguration(configuration)
  );

  const outs = getOutsFromOutsMapList(outsMapList);
  const ukeire = outs.reduce((total, out) => total + wall[out], 0);
  
  if (shanten === endShanten) {
    return calcDrawChance(wallTiles, ukeire, drawsLeft);
  }

  let agariChance = 0;
  let ryuukyokuChance = 1;

  // TODO: Figure out how to memoize this, instead of recalculating everything
  // on every iteration.
  for (let i = 0; i < drawsLeft - (shanten - endShanten); i++) {
    const drawChance = calcDrawChance(wallTiles - i, ukeire, 1);
    const advanceChance = ryuukyokuChance * drawChance;

    for (let j = 0; j < outs.length; j++) {
      const out = outs[j];

      if (wall[out] === 0) {
        continue;
      }

      const newWall = {};
      Object.assign(newWall, wall);

      newWall[out] -= 1;

      const newConfigurationList = getNewConfigurationListForOut(
        configurationList,
        outsMapList,
        newWall, 
        out,
      );

      // Get the best performing set of configuration lists
      // TODO: There has to be a nicer way to do this...
      const configurationHash = {};

      newConfigurationList.forEach(configuration => {
        const tiles = flattenConfiguration(configuration);
        tiles.sort((a, b) => a - b);
        
        addToBucketMap(configurationHash, tiles, configuration);
      });

      let newAgariChance = -1;

      Object.values(configurationHash).forEach(newConfigurationList => {
        const configurationListAgariChance = simulate(
          newWall,
          wallTiles - i - 1,
          newConfigurationList,
          shanten - 1,
          endShanten,
          drawsLeft - i - 1,
        );

        if (configurationListAgariChance > newAgariChance) {
          newAgariChance = configurationListAgariChance;
        }
      });

      agariChance += wall[out] / ukeire * advanceChance * newAgariChance;
    }

    ryuukyokuChance *= (1 - drawChance); 
  }

  return agariChance;
}

//=============================================================================
// ** Main
//=============================================================================

const wall = {}

for (let i = 0; i < 34; i++) {
  wall[i] = 4;
}

// 378m 2378p 123789s
let hand = [2, 6, 7, 10, 11, 15, 16, 18, 19, 20, 24, 25, 26];

// 22m 2356p 1888999s
// let hand = [1, 1, 10, 11, 13, 14, 18, 25, 25, 25, 26, 26, 26];

hand.forEach(tile => wall[tile] -= 1);

const hrStart = process.hrtime();

const configurations = calcMentsuConfigurations(hand);
const minShantenConfigurations = getMinShantenConfigurations(configurations);

for (let i = 18; i > 0; i--) {
  const drawsLeft = i;
  const wallTiles = 123 - (18 - drawsLeft);
  
  console.log(simulate(wall, wallTiles, minShantenConfigurations, 2, 0, drawsLeft));
}


const hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);