const buildService = require('../services/buildService');

const checkCompatibility = async (req, res) => {
  try {
    const build = req.body;
    const result = await buildService.checkCompatibility(build);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in checkCompatibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi kiểm tra tương thích: ' + error.message
    });
  }
};

const saveBuild = async (req, res) => {
  try {
    const buildData = req.body;
    const userId = req.user.id;

    const savedBuild = await buildService.saveBuild(userId, buildData);

    return res.status(201).json({
      success: true,
      data: savedBuild,
      message: "Lưu cấu hình thành công"
    });
  } catch (error) {
    console.error('Error in saveBuild:', error);
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || []
    });
  }
};

const getAllMyBuilds = async (req, res) => {
  try {
    const userId = req.user.id;
    const builds = await buildService.getUserBuilds(userId);
    return res.status(200).json({
      success: true,
      data: builds
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyBuildById = async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    const build = await buildService.getUserBuildById(userId, buildId);
    return res.status(200).json({
      success: true,
      data: build
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const updateMyBuild = async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    const buildData = req.body;
    const updatedBuild = await buildService.updateUserBuild(userId, buildId, buildData);
    return res.status(200).json({
      success: true,
      data: updatedBuild,
      message: "Cập nhật cấu hình thành công"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || []
    });
  }
};

const deleteMyBuild = async (req, res) => {
  try {
    const userId = req.user.id;
    const buildId = req.params.id;
    await buildService.deleteUserBuild(userId, buildId);
    return res.status(200).json({
      success: true,
      message: "Xóa cấu hình thành công"
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  checkCompatibility,
  saveBuild,
  getAllMyBuilds,
  getMyBuildById,
  updateMyBuild,
  deleteMyBuild
};
