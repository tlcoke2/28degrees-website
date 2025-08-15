import SiteSettings from '../../models/SiteSettings.model.js';
import AppError from '../../utils/AppError.js';

// Admin: GET full settings
export const getAdminSettings = async (req, res, next) => {
  try {
    const doc = await SiteSettings.findOne({}) || await SiteSettings.create({});
    res.status(200).json({ status: 'success', data: doc });
  } catch (err) {
    next(err);
  }
};

// Admin: PUT update settings (full or partial)
export const updateAdminSettings = async (req, res, next) => {
  try {
    // force singleton: use a fixed id or first doc
    const existing = (await SiteSettings.findOne({})) || (await SiteSettings.create({}));
    const updated = await SiteSettings.findByIdAndUpdate(
      existing._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

// Public: GET sanitized subset
export const getPublicSettings = async (req, res, next) => {
  try {
    const doc = await SiteSettings.findOne({}).lean();
    if (!doc) return res.status(200).json({ status: 'success', data: {} });

    const {
      siteTitle, siteDescription, socialMedia, seo,
      currency, timezone, dateFormat, timeFormat, itemsPerPage,
      enableAnalytics, googleAnalyticsId,
    } = doc;

    res.status(200).json({
      status: 'success',
      data: {
        siteTitle,
        siteDescription,
        socialMedia,
        seo,
        currency,
        timezone,
        dateFormat,
        timeFormat,
        itemsPerPage,
        enableAnalytics,
        googleAnalyticsId,
      },
    });
  } catch (err) {
    next(err);
  }
};
