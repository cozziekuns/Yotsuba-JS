/* TODO List:
  - Memoize the Shoubu calculations
  - Customizable Dora
  - Chiitoi and Kokushi
  - Clean up code, turn it into a library
*/

//----------------------------------------------------------------------------
// * Utility Methods
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

function calcDrawChance(wallTiles, ukeire, drawsLeft) {
  let missChance = 1;

  for (let i = 0; i < drawsLeft; i++) {
    missChance *= wallTiles - ukeire - i;
    missChance /= wallTiles - i;
  }

  return 1 - missChance;
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
    this.createTilesToDiscard();
    this.spawnChildren();
  }

  //--------------------------------------------------------------------------
  // * Initialization Methods
  //--------------------------------------------------------------------------

  createTilesToDiscard() {
    this.tilesToDiscard = new Map();

    this.outs.forEach(out => {
      const tileArray = new Array(18).fill(-1);

      this.tilesToDiscard.set(out, tileArray);
    });
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

//----------------------------------------------------------------------------
// * Simulation Methods
//----------------------------------------------------------------------------

// Optimise for the hitori mahjong case.
function simulateHitori(
  wall,
  wallTiles,
  configurationNode,
  endShanten,
  drawsLeft,
  memo,
) {
  let agariChance = 0;

  if (drawsLeft === 0 || configurationNode.shanten - endShanten > drawsLeft) {
    return agariChance;
  }

  if (memo.has(configurationNode)) {
    const drawsLeftTable = memo.get(configurationNode);

    if (drawsLeftTable[drawsLeft - 1] >= 0) {
      return drawsLeftTable[drawsLeft - 1];
    }
  } else {
    const drawsLeftTable = new Array(18).fill(-1);

    memo.set(configurationNode, drawsLeftTable);
  }

  const ukeire = configurationNode.outs.reduce(
    (total, out) => total + wall[out],
    0,
  );

  const drawChance = calcDrawChance(wallTiles, ukeire, 1);

  if (configurationNode.shanten > endShanten) {
    for (let i = 0; i < configurationNode.outs.length; i++) {
      const out = configurationNode.outs[i];
  
      if (wall[out] === 0) {
        continue;
      }
  
      const newWall = wall.slice();
      newWall[out] -= 1;
  
      let drawResult = -1;
      let tileToDiscard;

      const discardTilesCache = configurationNode.tilesToDiscard.get(out);

      if (discardTilesCache[drawsLeft - 1] >= 0) {
        tileToDiscard = discardTilesCache[drawsLeft - 1];

        drawResult = simulateHitori(
          newWall,
          wallTiles - 1,
          configurationNode.children.get(out).get(tileToDiscard),
          endShanten,
          drawsLeft - 1,
          memo,
        );
      } else {
        configurationNode.children.get(out).forEach(
          (candidateNode, candidateTileToDiscard) => {
            const candidateNodeAgariChance = simulateHitori(
              newWall,
              wallTiles - 1,
              candidateNode,
              endShanten,
              drawsLeft - 1,
              memo,
            )
      
            if (candidateNodeAgariChance > drawResult) {
              drawResult = candidateNodeAgariChance;
              tileToDiscard = candidateTileToDiscard;
            }
          }
        );

        discardTilesCache[drawsLeft - 1] = tileToDiscard;
      }

      agariChance += (wall[out] / ukeire) * drawResult * drawChance;
    }  
  } else {
    agariChance += drawChance;
  }

  const missResult = simulateHitori(
    wall,
    wallTiles - 1,
    configurationNode,
    endShanten, 
    drawsLeft - 1,
    memo,
  );

  agariChance += (1 - drawChance) * missResult;

  memo.get(configurationNode)[drawsLeft - 1] = agariChance;

  return agariChance;
}

// Simulate the black box shoubu case, where the opponent is tenpai with an 
// unknown wait.
function simulateBlackBoxShoubu(
  wall,
  wallTiles,
  configurationNode,
  oppUkeire,
  drawsLeft,
  currentPlayer,
) {
  let agariMatrix = new Array(4).fill(0);

  if (drawsLeft === 0) {
    return agariMatrix;
  }

  const playerUkeire = configurationNode.outs.reduce(
    (total, out) => total + wall[out],
    0,
  );

  const playerDrawChance = calcDrawChance(wallTiles, playerUkeire, 1);
  const oppDrawChance = calcDrawChance(wallTiles, oppUkeire, 1);

  if (configurationNode.shanten === 0) {
    agariMatrix[currentPlayer] += playerDrawChance;
  } else if (currentPlayer === 0) {
    const playerDrawsLeft = Math.ceil(drawsLeft / 2);

    for (let i = 0; i < configurationNode.outs.length; i++) {
      const out = configurationNode.outs[i];
  
      if (wall[out] === 0) {
        continue;
      }
  
      const newWall = wall.slice();
      newWall[out] -= 1;

      let newConfigurationNode;

      if (configurationNode.shanten >= playerDrawsLeft) {
        // Player can't tsumo anyway.
        newConfigurationNode = configurationNode;
      } else {
        const discardTilesCache = configurationNode.tilesToDiscard.get(out);

        newConfigurationNode = configurationNode.children.get(out).get(
          discardTilesCache[playerDrawsLeft - 1],
        );
      }

      const drawResult = simulateBlackBoxShoubu(
        newWall,
        wallTiles - 1,
        newConfigurationNode,
        oppUkeire,
        drawsLeft - 1,
        (currentPlayer + 1) % 2,
      );

      const outDrawChance = (wall[out] / playerUkeire) * playerDrawChance;

      agariMatrix.forEach((_, index) => { 
        agariMatrix[index] += outDrawChance * drawResult[index];
      });
    }
  }

  agariMatrix[2 + currentPlayer] += oppDrawChance;

  let missChance;

  if (configurationNode.shanten === 0 || currentPlayer === 0) {
    missChance = 1 - playerDrawChance - oppDrawChance;
  } else {
    missChance = 1 - oppDrawChance;
  }

  const missResult = simulateBlackBoxShoubu(
    wall,
    wallTiles - 1,
    configurationNode,
    oppUkeire,
    drawsLeft - 1,
    (currentPlayer + 1) % 2,
  );

  agariMatrix.forEach((_, index) => { 
    agariMatrix[index] += missChance * missResult[index];
  });

  return agariMatrix;
}

//----------------------------------------------------------------------------
// * Multi-Man Simulation Helpers
//----------------------------------------------------------------------------

function getUkeireList(wall, configurationNodes, currentPlayer) {
  const numPlayers = configurationNodes.length;
  const ukeireList = new Array(numPlayers).fill(0);

  const currentPlayerOuts = configurationNodes[currentPlayer].outs;

  for (let i = 0; i < numPlayers; i++) {
    let outsToAdd;

    if (i === currentPlayer) {
      outsToAdd = currentPlayerOuts; 
    } else {
      if (configurationNodes[i].shanten > 0) {
        continue;
      }

      const outsSet = new Set(configurationNodes[i].outs);

      currentPlayerOuts.forEach(out => outsSet.delete(out));
      outsToAdd = [...outsSet];
    }

    ukeireList[i] = outsToAdd.reduce((total, out) => total + wall[out], 0);
  }

  return ukeireList;
}

function getTotalUkeire(wall, configurationNodes) {
  const totalOuts = configurationNodes.reduce(
    (total, node) => total = total.concat(node.outs),
    [],
  );

  return [...new Set(totalOuts)].reduce((total, out) => total + wall[out], 0);
}

function getBestConfigurationNodeForOut(
  wall,
  wallTiles,
  candidateConfigurationNodes,
  drawsLeft, 
) {
  if (drawsLeft === 0 || candidateConfigurationNodes.length === 1) {
    return candidateConfigurationNodes[0];
  }

  let bestConfigurationNode;
  let outAgariChance = -1; 

  candidateConfigurationNodes.forEach(configurationNode => {
    const outAgariChanceForNode = simulateShoubu(
      wall, 
      wallTiles,
      [configurationNode],
      [drawsLeft],
      0,
    );

    if (outAgariChanceForNode > outAgariChance) {
      outAgariChance = outAgariChanceForNode;
      bestConfigurationNode = configurationNode;
    }
  });

  return bestConfigurationNode;
}

// TODO: EXPERIMENTAL. This function is really, really slow right now and needs 
// some optimization. Either bottom-up DP or top-down memoization.
function simulateShoubu(
  wall,
  wallTiles,
  configurationNodes,
  drawsLeft,
  currentPlayer,
) {
  const numPlayers = configurationNodes.length;

  let agariMatrix = new Array(numPlayers ** 2).fill(0);

  if (drawsLeft === 0) {
    return agariMatrix;
  }

  const ukeireList = getUkeireList(wall, configurationNodes, currentPlayer);
  const totalUkeire = getTotalUkeire(wall, configurationNodes);

  const eventChance = calcDrawChance(wallTiles, totalUkeire, 1);

  for (let i = 0; i < numPlayers; i++) {
    const drawChance = calcDrawChance(wallTiles, ukeireList[i], 1);

    if (i === currentPlayer && configurationNodes[i].shanten > 0) {
      const playerDrawsLeft = Math.ceil(drawsLeft / numPlayers) - 1;

      if (configurationNodes[i].shanten > playerDrawsLeft) {
        continue;
      }

      for (let j = 0; j < configurationNodes[i].outs.length; j++) {
        const out = configurationNodes[i].outs[j];

        if (wall[out] === 0) {
          continue;
        }

        const newWall = wall.slice();
        newWall[out] -= 1;

        // TODO: For now, let's assume that the currentPlayer chooses the 
        // configuration node that gives them the most HMS win percentage.
        //
        // We probably want to add a that restricts the player from 
        // playing certain outs (i.e. the dora).
        const newConfigurationNode = getBestConfigurationNodeForOut(
          newWall,
          wallTiles - 1,
          Array.from(configurationNodes[i].children.get(out).values()),
          playerDrawsLeft,
        );

        const newConfigurationNodes = configurationNodes.slice();
        newConfigurationNodes[i] = newConfigurationNode;

        const drawResult = simulateShoubu(
          wall,
          wallTiles - 1,
          newConfigurationNodes,
          drawsLeft - 1,
          (currentPlayer + 1) % numPlayers,
        )

        agariMatrix.forEach((_, index) => {
          const drawChanceForOut = (wall[out] / ukeireList[i]) * drawChance;

          agariMatrix[index] += drawChanceForOut  * drawResult[index];
        });
      }
    } else {
      agariMatrix[numPlayers * i + currentPlayer] += drawChance;
    }
  }

  // TODO: Eventually we should modifying wall for all the different draws...
  // That might actually be intractable though, makes it really hard to DP.
  const missResult = simulateShoubu(
    wall,
    wallTiles - 1,
    configurationNodes,
    drawsLeft - 1,
    (currentPlayer + 1) % numPlayers,
  )

  agariMatrix.forEach((_, index) => { 
    agariMatrix[index] += (1 - eventChance) * missResult[index];
  });

  return agariMatrix;
}

//=============================================================================
// ** Main
//=============================================================================

const wall = new Array(34).fill(4);

// 378m 2378p 123789s
// let handPlayer = [2, 6, 7, 10, 11, 15, 16, 18, 19, 20, 24, 25, 26];

// 22m 2356p 1888999s
let handPlayer = [1, 1, 10, 11, 15, 16, 16, 25, 25, 25, 26, 26, 26];

// 2223334445589m
// const handPlayer = [1, 1, 9, 10, 16, 17, 18, 25, 25, 25, 26, 26, 26];
// const handOpp = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 22, 23];

// 2223334445589p
const handOpp = [10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 16, 17];

handPlayer.forEach(tile => wall[tile] -= 1);
// handOpp.forEach(tile => wall[tile] -= 1);

const configurationsPlayer = calcMentsuConfigurations(handPlayer);
const minShantenConfigurationsPlayer = getMinShantenConfigurations(configurationsPlayer);

const configurationsOpp = calcMentsuConfigurations(handOpp);
const minShantenConfigurationsOpp = getMinShantenConfigurations(configurationsOpp);

const configurationPlayer = new ConfigurationNode(minShantenConfigurationsPlayer);
const configurationOpp = new ConfigurationNode(minShantenConfigurationsOpp);

const wallTiles = 123;

const drawsLeft = 18;
const currentPlayer = 0;

const memo = new WeakMap();

simulateHitori(
  wall,
  wallTiles,
  configurationPlayer,
  0,
  drawsLeft,
  memo,
);

let hrStart = process.hrtime();

console.log(simulateBlackBoxShoubu(
  wall,
  wallTiles,
  configurationPlayer,
  8,
  drawsLeft,
  0,
));


let hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);

/*

console.log(
  simulateShoubu(
    wall,
    wallTiles,
    [configurationPlayer],
    drawsLeft,
    currentPlayer,
  )
)

*/


