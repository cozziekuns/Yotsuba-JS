//----------------------------------------------------------------------------
// * Utility Methods
//----------------------------------------------------------------------------

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
  const configurations = [];
  let queue = [[hand, [], false]];

  while (queue.length > 0) {
    const nextElement = queue.shift();

    const currentHand = nextElement[0];
    const oldHand = nextElement[1];
    const hasAtama = nextElement[2];

    if (currentHand.length === 0) {
      // The hand needs to have a head candidate to be considered a valid 
      // configuration.
      if (hasAtama) {
        // Remove all elements that do not have an empty hand from the queue.
        return [oldHand].concat(
          queue
            .filter(element => element[0].length === 0 && element[2])
            .map(element => element[1])
        );
      }

      continue;
    }

    if (currentHand.length > 2) {
      // Kootsu
      if (currentHand[0] === currentHand[1] && currentHand[1] === currentHand[2]) {
        queue.push([
          currentHand.slice(3, currentHand.length),
          oldHand.concat([currentHand.slice(0, 3)]),
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
          queue.push([newHand, oldHand.concat([shuntsu]), hasAtama]);
        }

      }
    }

    if (currentHand.length > 1) {
      // Toitsu
      if (currentHand[0] === currentHand[1]) {
        queue.push([
          currentHand.slice(2, currentHand.length),
          oldHand.concat([currentHand.slice(0, 2)]),
          true,
        ]);
      }

      // Ryanmen / Penchan
      if (tileValue(currentHand[0]) < 9 && currentHand.includes(currentHand[0] + 1)) {
        const newHand = currentHand.slice(1, currentHand.length);
        newHand.splice(newHand.indexOf(currentHand[0] + 1), 1);

        const taatsu = [currentHand[0], currentHand[0] + 1];
        queue.push([newHand, oldHand.concat([taatsu]), hasAtama]);
      }

      // Kanchan
      if (tileValue(currentHand[0]) < 8 && currentHand.includes(currentHand[0] + 2)) {
        const newHand = currentHand.slice(1, currentHand.length);
        newHand.splice(newHand.indexOf(currentHand[0] + 2), 1);

        const taatsu = [currentHand[0], currentHand[0] + 2];
        queue.push([newHand, oldHand.concat([taatsu]), hasAtama]);
      }
    }

    // Tanki
    queue.push([
      currentHand.slice(1, currentHand.length),
      oldHand.concat([currentHand.slice(0, 1)]),
      true,
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

function getOutsForConfiguration(configuration) {
  const outs = [];

  const atamaCandidates = configuration.filter(
    shape => shape.length === 2 && shape[0] === shape[1]
  );

  const mentsu = configuration.filter(shape => shape.length === 3);
  const taatsu = configuration.filter(shape => shape.length === 2);
  const floatTiles = configuration.filter(shape => shape.length === 1);

  if (atamaCandidates.length === 1) {
    // Atama is locked and we cannot treat it as a taatsu.
    taatsu.splice(taatsu.indexOf(atamaCandidates[0]), 1);
  } else if (atamaCandidates.length === 0) {
    // Any of the float tiles can become a head.
    outs.push(...floatTiles.map(shape => shape[0]));
  }

  taatsu.forEach(shape => outs.push(...getOutsForShape(shape)));

  if (mentsu.length + taatsu.length < 4) {
    floatTiles.forEach(shape => outs.push(...getOutsForShape(shape)));
  }

  return [...new Set(outs)];
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

let hand = [1, 2, 6, 7, 10, 11, 15, 16, 19, 20, 24, 25, 26];

const hrStart = process.hrtime();

const configurations = calcMentsuConfigurations(hand);
const minShantenConfigurations = getMinShantenConfigurations(configurations);

let outsForHand = [];

minShantenConfigurations.forEach(configuration => 
  outsForHand.push(...getOutsForConfiguration(configuration))
);

outsForHand = [...new Set(outsForHand)].sort((a, b) => a - b);

const hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);