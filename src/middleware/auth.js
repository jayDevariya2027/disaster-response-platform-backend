const auth = async (req, res, next) => {
  req.user = { id: "netrunnerX", role: "admin" };
  next();
};

module.exports = { auth };
