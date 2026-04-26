import express from 'express'
import { getDashboardStats } from '../controllers/adminController.js'
import { getAllUsers, deleteUser } from '../controllers/adminController.js';

const router = express.Router()

router.get('/stats', getDashboardStats)
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

export default router