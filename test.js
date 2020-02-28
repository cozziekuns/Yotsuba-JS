function tileValue(tile) {
  return (tile >= 27 ? 10 : (tile % 9 + 1));
}

function calcMentsuConfigurations(hand) {
  const configurations = [];
  let queue = [[hand, []]];

  while (queue.length > 0) {
    const nextElement = queue.shift();

    const currentHand = nextElement[0];
    const oldHand = nextElement[1];

    if (currentHand.length === 0) {
      // The hand needs to have a head candidate to be considered a valid 
      // configuration.
      if (
        oldHand.some(group => group.length === 1) || 
        oldHand.some(group => group.length === 2 && group[0] === group[1])
      ) {
        // Remove all elements that do not have an empty hand from the queue.
        queue = queue.filter(element => element[0].length === 0);
        configurations.push(oldHand);
      }

      continue;
    }

    if (currentHand.length > 2) {
      // Kootsu
      if (currentHand[0] === currentHand[1] && currentHand[1] === currentHand[2]) {
        queue.push([
          currentHand.slice(3, currentHand.length),
          oldHand.concat([currentHand.slice(0, 3)]),
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
          queue.push([newHand, oldHand.concat([shuntsu])]);
        }

      }
    }

    if (currentHand.length > 1) {
      // Toitsu
      if (currentHand[0] === currentHand[1]) {
        queue.push([
          currentHand.slice(2, currentHand.length),
          oldHand.concat([currentHand.slice(0, 2)]),
        ]);
      }

      // Ryanmen / Penchan
      if (tileValue(currentHand[0]) < 9 && currentHand.includes(currentHand[0] + 1)) {
        const newHand = currentHand.slice(1, currentHand.length);
        newHand.splice(newHand.indexOf(currentHand[0] + 1), 1);

        const taatsu = [currentHand[0], currentHand[0] + 1];
        queue.push([newHand, oldHand.concat([taatsu])]);
      }

      // Kanchan
      if (tileValue(currentHand[0]) < 9 && currentHand.includes(currentHand[0] + 2)) {
        const newHand = currentHand.slice(1, currentHand.length);
        newHand.splice(newHand.indexOf(currentHand[0] + 2), 1);

        const taatsu = [currentHand[0], currentHand[0] + 2];
        queue.push([newHand, oldHand.concat([taatsu])]);
      }
    }

    // Tanki
    queue.push([
      currentHand.slice(1, currentHand.length),
      oldHand.concat([currentHand.slice(0, 1)]),
    ]);
  }

  return configurations;
}

let hand = [1, 2, 6, 7, 10, 11, 15, 16, 19, 20, 24, 25, 26];

const hrStart = process.hrtime()
for (let i = 0; i < 1000; i++) {
  calcMentsuConfigurations(hand);
}
const hrEnd = process.hrtime(hrStart);
console.log(hrEnd[0], hrEnd[1] / 1000000);