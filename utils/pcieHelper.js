function pcieRank(versionName) {
  if (!versionName) return 0;
  
  if (versionName.includes("5")) return 5;
  if (versionName.includes("4")) return 4;
  if (versionName.includes("3")) return 3;
  if (versionName.includes("2")) return 2;
  
  return 0;
}

module.exports = { pcieRank };
