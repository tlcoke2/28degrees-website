import mongoose from 'mongoose';

const PageContentSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      enum: ['home', 'about'],
      required: true,
      unique: true,
      index: true,
    },
    // Flexible content bag the admin UI can shape
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

export default mongoose.model('PageContent', PageContentSchema);
