const genericController = require("./genericController");
const Cpu = require("../schemas/cpu");
const Mainboard = require("../schemas/mainboard");
const Ram = require("../schemas/ram");
const Vga = require("../schemas/vga");
const Ssd = require("../schemas/ssd");
const Hdd = require("../schemas/hdd");
const Psu = require("../schemas/psu");
const PcCase = require("../schemas/pc-case");
const Cooler = require("../schemas/cooler");

// Define population paths for each component
Cpu.getPopulatePaths = () => ["socket", "pcieVersion"];
Mainboard.getPopulatePaths = () => [
  "socket",
  "ramType",
  "size",
  "pcieVgaVersion",
];
Ram.getPopulatePaths = () => ["ramType"];
Vga.getPopulatePaths = () => ["pcieVersion", "powerConnector"];
Ssd.getPopulatePaths = () => ["ssdType", "formFactor", "interfaceType"];
Hdd.getPopulatePaths = () => ["formFactor", "interfaceType"];
Psu.getPopulatePaths = () => ["pcieConnectors"];
PcCase.getPopulatePaths = () => ["size"];
Cooler.getPopulatePaths = () => ["coolerType"];

module.exports = {
  cpuController: genericController(Cpu, "CPU"),
  mainboardController: genericController(Mainboard, "Mainboard"),
  ramController: genericController(Ram, "RAM"),
  vgaController: genericController(Vga, "Card màn hình"),
  ssdController: genericController(Ssd, "Ổ cứng SSD"),
  hddController: genericController(Hdd, "Ổ cứng HDD"),
  psuController: genericController(Psu, "Nguồn (PSU)"),
  pcCaseController: genericController(PcCase, "Vỏ Case"),
  coolerController: genericController(Cooler, "Tản nhiệt"),
};
