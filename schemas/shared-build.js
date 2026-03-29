const mongoose = require('mongoose');

const sharedBuildSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Nội dung mô tả là bắt buộc'],
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  views: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  pcBuild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'build',
    required: true
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Virtual populates nếu cần thiết
sharedBuildSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Configure JSON serialization để include virtuals
sharedBuildSchema.set('toJSON', { virtuals: true });
sharedBuildSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SharedBuild', sharedBuildSchema);
