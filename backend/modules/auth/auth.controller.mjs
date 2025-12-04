import authService from './auth.service.mjs';
import logger from '../../config/logger.mjs';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req);
    return res.apiSuccess(result, 'Login successful');
  } catch (error) {
    logger.error('Login failed:', { error: error.message });
    return res.apiError(error.message, 401);
  }
};

export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body, req);
    return res.apiSuccess(result, 'Registration successful');
  } catch (error) {
    logger.error('Registration failed:', { error: error.message });
    return res.apiError(error.message, 400);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken, req);
    return res.apiSuccess(result, 'Token refreshed');
  } catch (error) {
    logger.error('Token refresh failed:', { error: error.message });
    return res.apiError(error.message, 401);
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return res.apiSuccess(null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout failed:', { error: error.message });
    return res.apiError(error.message, 400);
  }
};

export default { login, register, refreshToken, logout };
