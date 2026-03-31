import { Router } from 'express';
import {
    getHistory,
    getHistoryItem,
    deleteHistoryItem,
    clearHistory,
} from '../controllers/history.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getHistory);
router.delete('/clear', clearHistory);
router.get('/:id', getHistoryItem);
router.delete('/:id', deleteHistoryItem);

export default router;