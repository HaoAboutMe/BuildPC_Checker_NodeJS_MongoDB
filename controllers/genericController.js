/**
 * Generic Controller to avoid code duplication for basic CRUD operations
 */
const genericController = (Model, modelNameVi) => {
  return {
    // Get all items (not deleted)
    getAll: async (req, res) => {
      try {
        const query = { isDeleted: false };
        let items = Model.find(query);

        // Auto populate if the model has a static method to get populate paths
        // Or we can manually define them for each model
        if (Model.getPopulatePaths) {
          items = items.populate(Model.getPopulatePaths());
        }

        const data = await items;
        res.status(200).json({ success: true, data });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    // Create a new item
    create: async (req, res) => {
      try {
        // Check for uniqueness on 'name' if applicable
        if (req.body.name) {
          const existing = await Model.findOne({
            name: req.body.name,
            isDeleted: false,
          });
          if (existing) {
            return res
              .status(400)
              .json({ success: false, message: `${modelNameVi} đã tồn tại` });
          }
        }

        const newItem = new Model(req.body);
        await newItem.save();
        res.status(201).json({ success: true, data: newItem });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    },

    // Get by ID
    getById: async (req, res) => {
      try {
        let item = Model.findById(req.params.id);

        if (Model.getPopulatePaths) {
          item = item.populate(Model.getPopulatePaths());
        }

        const data = await item;
        if (!data || data.isDeleted) {
          return res
            .status(404)
            .json({
              success: false,
              message: `Không tìm thấy ${modelNameVi.toLowerCase()}`,
            });
        }
        res.status(200).json({ success: true, data });
      } catch (error) {
        res
          .status(404)
          .json({
            success: false,
            message: `Không tìm thấy ${modelNameVi.toLowerCase()}`,
          });
      }
    },

    // Update item
    update: async (req, res) => {
      try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!item || item.isDeleted) {
          return res
            .status(404)
            .json({
              success: false,
              message: `Không tìm thấy ${modelNameVi.toLowerCase()}`,
            });
        }
        res.status(200).json({ success: true, data: item });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    },

    // Soft delete
    delete: async (req, res) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item || item.isDeleted) {
          return res
            .status(404)
            .json({
              success: false,
              message: `Không tìm thấy ${modelNameVi.toLowerCase()}`,
            });
        }
        item.isDeleted = true;
        await item.save();
        res
          .status(200)
          .json({
            success: true,
            message: `Đã xóa ${modelNameVi.toLowerCase()} thành công`,
          });
      } catch (error) {
        res
          .status(404)
          .json({
            success: false,
            message: `Không tìm thấy ${modelNameVi.toLowerCase()}`,
          });
      }
    },
  };
};

module.exports = genericController;
