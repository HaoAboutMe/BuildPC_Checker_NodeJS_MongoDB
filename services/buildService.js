const Cpu = require('../schemas/cpu');
const Mainboard = require('../schemas/mainboard');
const Ram = require('../schemas/ram');
const Vga = require('../schemas/vga');
const Ssd = require('../schemas/ssd');
const Hdd = require('../schemas/hdd');
const Psu = require('../schemas/psu');
const PcCase = require('../schemas/pc-case');
const Cooler = require('../schemas/cooler');
const Build = require('../schemas/build');

const cpuChecker = require('./compatibility/cpuChecker');
const ramChecker = require('./compatibility/ramChecker');
const vgaChecker = require('./compatibility/vgaChecker');
const storageChecker = require('./compatibility/storageChecker');
const coolerChecker = require('./compatibility/coolerChecker');
const powerChecker = require('./compatibility/powerChecker');
const bottleneckService = require('./bottleneckService');


/**
 * Fetch a component by ID and populate its support entities
 */
async function fetchComponent(Model, id) {
  if (!id) return null;
  const populatePaths = Model.getPopulatePaths ? Model.getPopulatePaths() : [];
  return await Model.findById(id).populate(populatePaths);
}

const checkCompatibility = async (build) => {
  const errors = [];
  const warnings = [];

  const {
    cpuId,
    mainboardId,
    ramId,
    ramQuantity = 1,
    vgaId,
    ssdIds = [],
    hddIds = [],
    psuId,
    caseId,
    coolerId
  } = build;

  // Fetch components in parallel
  const [cpu, mainboard, ram, vga, ssds, hdds, psu, pcCase, cooler] = await Promise.all([
    fetchComponent(Cpu, cpuId),
    fetchComponent(Mainboard, mainboardId),
    fetchComponent(Ram, ramId),
    fetchComponent(Vga, vgaId),
    ssdIds.length ? Ssd.find({ _id: { $in: ssdIds } }).populate(Ssd.getPopulatePaths ? Ssd.getPopulatePaths() : []) : Promise.resolve([]),
    hddIds.length ? Hdd.find({ _id: { $in: hddIds } }).populate(Hdd.getPopulatePaths ? Hdd.getPopulatePaths() : []) : Promise.resolve([]),
    fetchComponent(Psu, psuId),
    fetchComponent(PcCase, caseId),
    fetchComponent(Cooler, coolerId)
  ]);

  const components = { cpu, mainboard, ram, vga, ssds, hdds, psu, pcCase, cooler };

  // Run checkers
  cpuChecker(components, errors, warnings);
  ramChecker(components, errors, warnings, ramQuantity);
  vgaChecker(components, errors, warnings);
  storageChecker(components, errors, warnings);
  coolerChecker(components, errors, warnings);
  const recommendedPsuWattage = powerChecker(components, errors, warnings, ramQuantity);

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
    recommendedPsuWattage
  };
};

const saveBuild = async (userId, buildData) => {
  // Check compatibility first
  const compatResult = await checkCompatibility(buildData);

  if (!compatResult.compatible) {
    const error = new Error('Cấu hình có lỗi tương thích, không thể lưu.');
    error.errors = compatResult.errors;
    throw error;
  }

  const newBuild = new Build({
    name: buildData.name,
    description: buildData.description,
    user: userId,
    cpu: buildData.cpuId || null,
    mainboard: buildData.mainboardId || null,
    ram: buildData.ramId || null,
    ramQuantity: buildData.ramQuantity || 1,
    vga: buildData.vgaId || null,
    ssds: buildData.ssdIds || [],
    hdds: buildData.hddIds || [],
    psu: buildData.psuId || null,
    pcCase: buildData.caseId || null,
    cooler: buildData.coolerId || null,
  });

  const savedBuild = await newBuild.save();
  return await savedBuild.populate('cpu mainboard ram vga ssds hdds psu pcCase cooler', 'name');
};

const getUserBuilds = async (userId) => {
  return await Build.find({ user: userId, isDeleted: false })
    .populate('cpu mainboard ram vga ssds hdds psu pcCase cooler', 'name');
};

const getUserBuildById = async (userId, buildId) => {
  const build = await Build.findOne({ _id: buildId, user: userId, isDeleted: false })
    .populate('cpu mainboard ram vga ssds hdds psu pcCase cooler', 'name');
  
  if (!build) {
    throw new Error('Không tìm thấy cấu hình hoặc bạn không có quyền truy cập.');
  }
  return build;
};

const updateUserBuild = async (userId, buildId, buildData) => {
  // Check ownership first
  const build = await Build.findOne({ _id: buildId, user: userId, isDeleted: false });
  if (!build) {
    throw new Error('Không tìm thấy cấu hình hoặc bạn không có quyền truy cập.');
  }

  // Check compatibility if components are being updated
  // For simplicity, we check compatibility on any update that might affect it
  const compatResult = await checkCompatibility({
    ...build.toObject(),
    ...buildData,
    cpuId: buildData.cpuId || build.cpu,
    mainboardId: buildData.mainboardId || build.mainboard,
    ramId: buildData.ramId || build.ram,
    ramQuantity: buildData.ramQuantity || build.ramQuantity,
    vgaId: buildData.vgaId || build.vga,
    ssdIds: buildData.ssdIds || build.ssds,
    hddIds: buildData.hddIds || build.hdds,
    psuId: buildData.psuId || build.psu,
    caseId: buildData.caseId || build.pcCase,
    coolerId: buildData.coolerId || build.cooler
  });

  if (!compatResult.compatible) {
    const error = new Error('Cấu hình mới có lỗi tương thích, không thể cập nhật.');
    error.errors = compatResult.errors;
    throw error;
  }

  // Map buildData to build fields
  if (buildData.name) build.name = buildData.name;
  if (buildData.description !== undefined) build.description = buildData.description;
  if (buildData.cpuId !== undefined) build.cpu = buildData.cpuId;
  if (buildData.mainboardId !== undefined) build.mainboard = buildData.mainboardId;
  if (buildData.ramId !== undefined) build.ram = buildData.ramId;
  if (buildData.ramQuantity !== undefined) build.ramQuantity = buildData.ramQuantity;
  if (buildData.vgaId !== undefined) build.vga = buildData.vgaId;
  if (buildData.ssdIds !== undefined) build.ssds = buildData.ssdIds;
  if (buildData.hddIds !== undefined) build.hdds = buildData.hddIds;
  if (buildData.psuId !== undefined) build.psu = buildData.psuId;
  if (buildData.caseId !== undefined) build.pcCase = buildData.caseId;
  if (buildData.coolerId !== undefined) build.cooler = buildData.coolerId;

  const updatedBuild = await build.save();
  return await updatedBuild.populate('cpu mainboard ram vga ssds hdds psu pcCase cooler', 'name');
};

const deleteUserBuild = async (userId, buildId) => {
  const result = await Build.findOneAndUpdate(
    { _id: buildId, user: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!result) {
    throw new Error('Không tìm thấy cấu hình hoặc bạn không có quyền truy cập.');
  }
  return result;
};

const checkBottleneck = async (buildData) => {
  const { cpuId, vgaId } = buildData;

  if (!cpuId || !vgaId) {
    const error = new Error('Thiếu CPU hoặc GPU để kiểm tra bottleneck.');
    error.status = 400;
    throw error;
  }

  const [cpu, vga] = await Promise.all([
    Cpu.findById(cpuId),
    Vga.findById(vgaId)
  ]);

  if (!cpu) throw new Error('Không tìm thấy thông tin CPU.');
  if (!vga) throw new Error('Không tìm thấy thông tin VGA.');

  const results = bottleneckService.calculateBottleneck(cpu, vga);

  return {
    cpu: {
      name: cpu.name,
      score: cpu.score || 0
    },
    gpu: {
      name: vga.name,
      score: vga.score || 0
    },
    results
  };
};


module.exports = {
  checkCompatibility,
  saveBuild,
  getUserBuilds,
  getUserBuildById,
  updateUserBuild,
  deleteUserBuild,
  checkBottleneck
};

