import CatalogItem, { CATALOG_TYPES } from '../models/CatalogItem.model.js';

// Parse common query params: page, limit, sort, search, type, price ranges
function parseListQuery(q) {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10) || 20));
  const skip = (page - 1) * limit;

  const sort = (() => {
    // Examples: "price", "-price", "name,-price"
    const s = String(q.sort || '').trim();
    if (!s) return { createdAt: -1 };
    const parts = s.split(',').map(p => p.trim()).filter(Boolean);
    const obj = {};
    for (const p of parts) {
      if (p.startsWith('-')) obj[p.slice(1)] = -1;
      else obj[p] = 1;
    }
    return obj;
  })();

  const filters = { active: true };
  if (q.type && CATALOG_TYPES.includes(q.type)) filters.type = q.type;
  if (q.minPriceCents) filters.priceCents = { ...(filters.priceCents || {}), $gte: Number(q.minPriceCents) };
  if (q.maxPriceCents) filters.priceCents = { ...(filters.priceCents || {}), $lte: Number(q.maxPriceCents) };

  const search = String(q.search || '').trim();

  return { page, limit, skip, sort, filters, search };
}

// PUBLIC: GET /api/v1/catalog
export async function getCatalog(req, res, next) {
  try {
    const { page, limit, skip, sort, filters, search } = parseListQuery(req.query);

    let mongoQuery = CatalogItem.find(filters);
    if (search) {
      mongoQuery = mongoQuery.find({ $text: { $search: search } });
    }

    const [items, total] = await Promise.all([
      mongoQuery.sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
      CatalogItem.countDocuments(search ? { ...filters, $text: { $search: search } } : filters),
    ]);

    res.json({
      page,
      limit,
      total,
      items: items.map(it => ({
        id: it._id.toString(),
        type: it.type,
        name: it.name,
        priceCents: it.priceCents,
        currency: it.currency,
        description: it.description,
        images: it.images || [],
        duration: it.duration || null,
        date: it.date || null,
        active: it.active,
        slug: it.slug,
        meta: it.meta || {},
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// PUBLIC: GET /api/v1/catalog/:idOrSlug
export async function getCatalogItem(req, res, next) {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const item = await CatalogItem.findOne(
      isObjectId ? { _id: idOrSlug, active: true } : { slug: idOrSlug, active: true }
    ).lean({ virtuals: true });

    if (!item) return res.status(404).json({ error: 'Catalog item not found' });

    item.id = item._id.toString();
    delete item._id;
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// ADMIN: POST /api/v1/catalog (create)
export async function createCatalogItem(req, res, next) {
  try {
    const payload = req.body;
    if (!payload.type || !CATALOG_TYPES.includes(payload.type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (typeof payload.priceCents !== 'number') {
      return res.status(400).json({ error: 'priceCents (number) is required' });
    }
    const doc = await CatalogItem.create(payload);
    res.status(201).json(doc.toJSON());
  } catch (err) {
    next(err);
  }
}

// ADMIN: PATCH /api/v1/catalog/:id (update)
export async function updateCatalogItem(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const doc = await CatalogItem.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: 'Catalog item not found' });
    res.json(doc.toJSON());
  } catch (err) {
    next(err);
  }
}

// ADMIN: DELETE /api/v1/catalog/:id
export async function deleteCatalogItem(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await CatalogItem.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Catalog item not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ADMIN: PATCH /api/v1/catalog/:id/toggle
export async function toggleActive(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await CatalogItem.findById(id);
    if (!doc) return res.status(404).json({ error: 'Catalog item not found' });
    doc.active = !doc.active;
    await doc.save();
    res.json(doc.toJSON());
  } catch (err) {
    next(err);
  }
}
