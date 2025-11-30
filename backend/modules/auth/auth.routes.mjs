import express from 'express';
import * as authController from './auth.controller.mjs';
import { validateLogin, validateRegister } from './auth.validator.mjs';

const router = express.Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
