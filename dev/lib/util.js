function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId() {
  return getRandomInt(100000, 999999);
}

function ids(object) {
  return Object.keys(object);
}

function numIds(object) {
  return ids(object).length;
}

function getWeightedRandomItem(options) {
  // expects options = [ { name: 'itemA', chance: 0.25 }, ...  ]
  const random = Math.random();
  let cumulativeChance = 0;
  // options.forEach(option => {
  //   cumulativeChance += option.chance;
  //   if (random < cumulativeChance) {
  //     return option.name;
  //   }
  // });
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    cumulativeChance += option.chance;
    if (random < cumulativeChance) {
      return option.name;
    }
  }
}

/* Not using module.exports because require() is unavailable in the sandbox environment */
