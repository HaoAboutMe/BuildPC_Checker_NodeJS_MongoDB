const mongoose = require('mongoose');
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
async function fetchComponent(Model, id, componentName) {
  if (!id) return null;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`ID của ${componentName} không hợp lệ`);
  }

  const populatePaths = Model.getPopulatePaths ? Model.getPopulatePaths() : [];
  const component = await Model.findById(id).populate(populatePaths);
  
  if (!component) {
    throw new Error(`Không tìm thấy ${componentName} với ID: "${id}"`);
  }
  
  return component;
}

/**
 * Validates an array of ObjectId strings
 */
function validateObjectIdArray(ids, componentName) {
  if (!Array.isArray(ids)) return;
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`ID của ${componentName} không hợp lệ: "${id}"`);
    }
  }
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
  } = build;
  
  // Ensure ssdIds and hddIds are arrays
  const ssdIds = Array.isArray(build.ssdIds) ? build.ssdIds : [];
  const hddIds = Array.isArray(build.hddIds) ? build.hddIds : [];
  const psuId = build.psuId;
  const caseId = build.caseId;
  const coolerId = build.coolerId;

  // Validate component IDs
  validateObjectIdArray(ssdIds, 'SSD');
  validateObjectIdArray(hddIds, 'HDD');

  // Fetch components in parallel
  const [cpu, mainboard, ram, vga, ssds, hdds, psu, pcCase, cooler] = await Promise.all([
    fetchComponent(Cpu, cpuId, 'CPU'),
    fetchComponent(Mainboard, mainboardId, 'Mainboard'),
    fetchComponent(Ram, ramId, 'RAM'),
    fetchComponent(Vga, vgaId, 'VGA'),
    ssdIds.length ? Ssd.find({ _id: { $in: ssdIds } }).populate(Ssd.getPopulatePaths ? Ssd.getPopulatePaths() : []) : Promise.resolve([]),
    hddIds.length ? Hdd.find({ _id: { $in: hddIds } }).populate(Hdd.getPopulatePaths ? Hdd.getPopulatePaths() : []) : Promise.resolve([]),
    fetchComponent(Psu, psuId, 'PSU'),
    fetchComponent(PcCase, caseId, 'Vỏ case'),
    fetchComponent(Cooler, coolerId, 'Tản nhiệt')
  ]);

  if (ssdIds.length !== ssds.length) {
    throw new Error('Một hoặc nhiều SSD không tìm thấy trong hệ thống.');
  }
  if (hddIds.length !== hdds.length) {
    throw new Error('Một hoặc nhiều HDD không tìm thấy trong hệ thống.');
  }

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
  // Kiểm tra trùng tên trong phạm vi tài khoản
  const existingBuild = await Build.findOne({
    user: userId,
    name: buildData.name,
    isDeleted: false,
  });
  if (existingBuild) {
    throw new Error(`Bạn đã có cấu hình tên "${buildData.name}". Vui lòng chọn tên khác.`);
  }

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
    ramQuantity: buildData.ramId ? (buildData.ramQuantity ?? 1) : 0,
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
  if (!mongoose.Types.ObjectId.isValid(buildId)) {
    throw new Error(`ID cấu hình không hợp lệ: "${buildId}"`);
  }
  const build = await Build.findOne({ _id: buildId, user: userId, isDeleted: false })
    .populate('cpu mainboard ram vga ssds hdds psu pcCase cooler', 'name');
  
  if (!build) {
    throw new Error('Không tìm thấy cấu hình hoặc bạn không có quyền truy cập.');
  }
  return build;
};

const updateUserBuild = async (userId, buildId, buildData) => {
  if (!mongoose.Types.ObjectId.isValid(buildId)) {
    throw new Error(`ID cấu hình không hợp lệ: "${buildId}"`);
  }
  // Check ownership first
  const build = await Build.findOne({ _id: buildId, user: userId, isDeleted: false });
  if (!build) {
    throw new Error('Không tìm thấy cấu hình hoặc bạn không có quyền truy cập.');
  }

  // Kiểm tra trùng tên (nếu tên thay đổi)
  if (buildData.name && buildData.name !== build.name) {
    const duplicateName = await Build.findOne({
      user: userId,
      name: buildData.name,
      isDeleted: false,
      _id: { $ne: buildId },
    });
    if (duplicateName) {
      throw new Error(`Bạn đã có cấu hình tên "${buildData.name}". Vui lòng chọn tên khác.`);
    }
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
  if (!mongoose.Types.ObjectId.isValid(buildId)) {
    throw new Error(`ID cấu hình không hợp lệ: "${buildId}"`);
  }
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
    fetchComponent(Cpu, cpuId, 'CPU'),
    fetchComponent(Vga, vgaId, 'VGA')
  ]);

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

