export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.apiError('Email and password are required', 400);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.apiError('Invalid email format', 400);
  }

  next();
};

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.apiError('Name, email and password are required', 400);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.apiError('Invalid email format', 400);
  }

  if (password.length < 8) {
    return res.apiError('Password must be at least 8 characters long', 400);
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return res.apiError('Password must contain at least one uppercase letter, one lowercase letter, and one number', 400);
  }

  next();
};
