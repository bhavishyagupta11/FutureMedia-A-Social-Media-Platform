const { z } = require("zod");

const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(30, "Username too long."),
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username/Email is required"),
  password: z.string().min(1, "Password is required")
});

const validateRegister = (req, res, next) => {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.issues.map(e => ({ field: e.path[0], message: e.message }));
      return res.status(400).json({ success: false, message: "Validation failed", data: null, meta: null, errors });
    }
    next(err);
  }
};

const validateLogin = (req, res, next) => {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.issues.map(e => ({ field: e.path[0], message: e.message }));
      return res.status(400).json({ success: false, message: "Validation failed", data: null, meta: null, errors });
    }
    next(err);
  }
};

module.exports = { validateRegister, validateLogin };
