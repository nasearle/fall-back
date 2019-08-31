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

/* Not using module.exports because require() is unavailable in the sandbox environment */
