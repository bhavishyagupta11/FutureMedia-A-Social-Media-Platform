const validateUpdateProfile = (req, res, next) => {
  // If we had specific profile rules, they would go here.
  next();
};

module.exports = { validateUpdateProfile };
