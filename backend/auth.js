const jwt = require("jsonwebtoken");
const JWT_SECRET = "employee-management-secret-key";

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. Invalid token format." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

module.exports = { verifyToken, JWT_SECRET };