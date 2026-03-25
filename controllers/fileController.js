const multer = require("multer");
const { storage } = require("../utils/cloudinary");

// File filter (optional, e.g., only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được phép tải lên tệp hình ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const FileController = {
  uploadImage: (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn một tệp để tải lên" });
    }

    // Với cloudinary-storage, req.file.path là URL của ảnh trên Cloudinary
    const imageUrl = req.file.path;

    res.status(200).json({
      success: true,
      message: "Tải lên ảnh thành công",
      url: imageUrl,
    });
  },
  uploadMiddleware: upload.single("image"),
};

module.exports = FileController;
