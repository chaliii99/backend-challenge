import { Router } from 'express';
import * as userController from '@/api/user/controllers/user';
import { authMiddleware } from '@/middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', userController.createUser);
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
