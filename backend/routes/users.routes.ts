import { Router } from 'express';
import {
  handleCreateUser,
  handleDeleteUser,
  handleListUsers,
  handleUpdateUser,
} from '../controllers/users.controller';
import { authorize, resolveDemoRole } from '../middleware/auth';

const router = Router();

router.use(resolveDemoRole, authorize('ADMIN'));

router.get('/', handleListUsers);
router.post('/', handleCreateUser);
router.patch('/:id', handleUpdateUser);
router.delete('/:id', handleDeleteUser);

export default router;
