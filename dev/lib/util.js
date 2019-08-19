/* Global functions in lib/ should should classic syntax instead of
const+arrow pattern. We need them to be hoisted since the build process
just bundles the files in random order */

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId() {
  return getRandomInt(100000, 999999);
}

/* Not using module.exports because require() is unavailable in the sandbox environment */
// module.exports = {
//   generateId: generateId,
// };
