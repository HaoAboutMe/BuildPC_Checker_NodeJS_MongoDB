const mongoose = require('mongoose');

const sharedBuildCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Nội dung bình luận không được để trống'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sharedBuild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedBuild',
    required: true
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = mongoose.model('SharedBuildComment', sharedBuildCommentSchema);
