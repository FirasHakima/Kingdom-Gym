const jwt = require("jsonwebtoken");
const SECRET = "kingdom-gym-secret-2026";
module.exports = function(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.admin = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
};
module.exports.SECRET = "kingdom-gym-secret-2026";
