const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../middleware/auth");
const auth = require("../middleware/auth");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Required" });
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
  const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, SECRET, { expiresIn: "12h" });
  res.json({ token, admin: { id: admin.id, name: admin.name, username: admin.username } });
});

router.post("/change-password", require("../middleware/auth"), (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(req.admin.id);
  if (!bcrypt.compareSync(oldPassword, admin.password))
    return res.status(400).json({ error: "Old password incorrect" });
  db.prepare("UPDATE admins SET password = ? WHERE id = ?").run(bcrypt.hashSync(newPassword, 10), req.admin.id);
  res.json({ message: "Password changed" });
});

module.exports = router;

router.post("/verify-password", auth, (req, res) => {
  try {
    const { password } = req.body;
    const admin = db.prepare("SELECT * FROM admins WHERE id=?").get(req.admin.id);
    const bcrypt = require("bcryptjs");
    if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: "Mot de passe incorrect" });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});