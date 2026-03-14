import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../middlewares/validation.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', validateLogin, authController.login.bind(authController));
router.post('/register', validateRegister, authController.register.bind(authController));

export default router;
