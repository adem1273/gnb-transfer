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
    return res.apiError('Password must be at least 8 characters', 400);
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return res.apiError('Password must contain uppercase, lowercase and number', 400);
  }

  next();
};
