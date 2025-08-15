import PageContent from '../models/PageContent.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const ALLOWED_PAGES = new Set(['home', 'about']);

const pick = (obj = {}, keys = []) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
};

// PUBLIC: GET /api/v1/content/:page
export const getPublicPage = asyncHandler(async (req, res) => {
  const page = String(req.params.page || '').toLowerCase();
  if (!ALLOWED_PAGES.has(page)) throw new ApiError(404, 'Unknown page');

  const doc = await PageContent.findOne({ page }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, { page, data: doc?.data || {} }, 'Content loaded'));
});

// ADMIN: GET /api/v1/content/:page/admin (returns same data; reserved for future drafts)
export const getAdminPage = asyncHandler(async (req, res) => {
  const page = String(req.params.page || '').toLowerCase();
  if (!ALLOWED_PAGES.has(page)) throw new ApiError(404, 'Unknown page');

  const doc = await PageContent.findOne({ page }).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, { page, data: doc?.data || {} }, 'Content loaded'));
});

// ADMIN: PUT /api/v1/content/:page  (upsert)
export const upsertPage = asyncHandler(async (req, res) => {
  const page = String(req.params.page || '').toLowerCase();
  if (!ALLOWED_PAGES.has(page)) throw new ApiError(404, 'Unknown page');

  // Accept any JSON shape under "data" (keep it flexible)
  const { data } = pick(req.body, ['data']);
  if (typeof data !== 'object' || data === null) {
    throw new ApiError(400, 'Payload must have a "data" object');
  }

  let doc = await PageContent.findOne({ page });
  if (!doc) {
    doc = new PageContent({ page, data });
    if (req.user?.id) doc.createdBy = req.user.id;
  } else {
    doc.data = data; // full replace (simpler than deep-merge)
  }
  if (req.user?.id) doc.updatedBy = req.user.id;
  await doc.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { page: doc.page, data: doc.data }, 'Content saved'));
});
