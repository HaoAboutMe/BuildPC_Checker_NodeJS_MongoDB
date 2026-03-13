const genericController = require("./genericController");
const Socket = require("../schemas/socket");
const RamType = require("../schemas/ram-type");
const PcieVersion = require("../schemas/pcie-version");
const PcieConnector = require("../schemas/pcie-connector");
const CoolerType = require("../schemas/cooler-type");
const SsdType = require("../schemas/ssd-type");
const InterfaceType = require("../schemas/interface-type");
const FormFactor = require("../schemas/form-factor");
const CaseSize = require("../schemas/case-size");

module.exports = {
  socketController: genericController(Socket, "Socket"),
  ramTypeController: genericController(RamType, "Loại RAM"),
  pcieVersionController: genericController(PcieVersion, "Phiên bản PCIe"),
  pcieConnectorController: genericController(
    PcieConnector,
    "Đầu cấp nguồn PCIe",
  ),
  coolerTypeController: genericController(CoolerType, "Loại tản nhiệt"),
  ssdTypeController: genericController(SsdType, "Loại SSD"),
  interfaceTypeController: genericController(InterfaceType, "Giao tiếp"),
  formFactorController: genericController(FormFactor, "Kích thước chuẩn"),
  caseSizeController: genericController(CaseSize, "Kích cỡ vỏ case/mainboard"),
};
