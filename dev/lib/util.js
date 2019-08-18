const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateId = () => {
  return getRandomInt(100000, 999999);
};

/* Not using module.exports because require() is unavailable in the sandbox environment */
// module.exports = {
//   generateId: generateId,
// };
