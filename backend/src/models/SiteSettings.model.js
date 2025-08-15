import mongoose from 'mongoose';

const SocialSchema = new mongoose.Schema(
  {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
  },
  { _id: false }
);

const SeoSchema = new mongoose.Schema(
  {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: String,
  },
  { _id: false }
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    siteTitle: { type: String, default: '28° West' },
    siteDescription: { type: String, default: 'Adventure Tours & Travel' },
    contactEmail: { type: String, default: 'info@28degreeswest.com' },
    contactPhone: { type: String, default: '' },
    address: { type: String, default: '' },

    socialMedia: { type: SocialSchema, default: () => ({}) },
    seo: { type: SeoSchema, default: () => ({}) },

    maintenanceMode: { type: Boolean, default: false },
    allowRegistrations: { type: Boolean, default: true },
    defaultUserRole: { type: String, enum: ['user', 'guide', 'admin'], default: 'user' },

    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },

    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, default: '12h' },
    itemsPerPage: { type: Number, default: 10, min: 1, max: 1000 },

    enableAnalytics: { type: Boolean, default: false },
    googleAnalyticsId: { type: String, default: '' },

    enableEmailNotifications: { type: Boolean, default: true },
    emailSender: { type: String, default: 'noreply@28degreeswest.com' },
  },
  { timestamps: true }
);

// ensure single doc (optional, we’ll upsert by _id='singleton')
SiteSettingsSchema.index({ _id: 1 });

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);
