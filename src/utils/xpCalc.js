const LEVEL_XP = {
  1: 100,
  2: 300,
  3: 600,
  4: 1000,
  5: 1500,
  6: 2000,
  7: 2500,
  8: 3000,
  9: 3500,
  10: 4000,
  11: 4500,
  12: 5000,
  13: 5500,
  14: 6000,
  15: 6500,
  16: 7000,
  17: 7500,
  18: 8000,
  19: 8500,
  20: 9000,
  21: 10000,
  22: 11000,
  23: 12000,
  24: 13000,
  25: 14000,
  26: 15000,
  27: 16000,
  28: 17000,
  29: 18000,
  30: 19000,
  31: 20000,
  32: 30000,
  33: 40000,
  34: 50000,
  35: 60000,
  36: 70000,
  37: 80000,
  38: 90000,
  39: 99000,
  40: 100000,
  41: 110000,
  42: 120000,
  43: 130000,
  44: 140000,
  45: 150000,
  46: 160000,
  47: 170000,
  48: 180000,
  49: 190000,
  50: 200000,
  51: 210000,
  52: 220000,
  53: 230000,
  54: 240000,
  55: 250000,
  56: 260000,
  57: 270000,
  58: 280000,
  59: 290000,
  60: 300000,
  61: 310000,
  62: 320000,
  63: 330000,
  64: 340000,
  65: 350000,
  66: 360000,
  67: 370000,
  68: 380000,
  69: 390000,
  70: 400000
};

const MAX_LEVEL = Math.max(...Object.keys(LEVEL_XP).map(Number));

function xpNeeded(level) {
  // total XP required to reach this level
  return LEVEL_XP[level] ?? null;
}

function getLevel(totalXp) {
  let lvl = 0;
  for (let i = 1; i <= MAX_LEVEL; i++) {
    if (totalXp >= LEVEL_XP[i]) lvl = i;
    else break;
  }
  return lvl;
}

function getNextLevelXp(level) {
  const next = level + 1;
  return LEVEL_XP[next] ?? null; // null means maxed (or table not extended)
}

module.exports = { xpNeeded, getLevel, getNextLevelXp, MAX_LEVEL };
