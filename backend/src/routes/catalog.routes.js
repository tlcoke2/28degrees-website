import express from 'express';
import {
  getCatalog,
  getCatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  toggleActive,
} from '../controllers/catalog.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/** -------- PUBLIC -------- **/
router.get('/', getCatalog);
router.get('/:idOrSlug', getCatalogItem);

/** -------- ADMIN -------- **/
router.use(protect, authorize('admin', 'lead-guide'));

// Create
router.post('/', createCatalogItem);

// Update / Delete
router.patch('/:id', updateCatalogItem);
router.delete('/:id', deleteCatalogItem);

// Activate / Deactivate
router.patch('/:id/toggle', toggleActive);

export default router;
