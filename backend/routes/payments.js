const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const now = () => new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/", auth, (req, res) => {
  try {
    const { member_id } = req.query;
    let q = "SELECT p.*, m.full_name, pl.name as plan_name, pl.price as plan_price FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id WHERE 1=1";
    const params = [];
    if (member_id) { q += " AND p.member_id=?"; params.push(member_id); }
    res.json(db.prepare(q + " ORDER BY p.created_at DESC").all(...params));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post("/", auth, (req, res) => {
  try {
    const { member_id, plan_id, amount_paid, start_date, notes } = req.body;
    if (!member_id||!plan_id||amount_paid===undefined||!start_date) return res.status(400).json({ error: "Champs manquants" });
    const plan = db.prepare("SELECT * FROM plans WHERE id=?").get(plan_id);
    if (!plan) return res.status(404).json({ error: "Forfait introuvable" });

    // Check for duplicate active plan in same category
    const today = new Date().toISOString().slice(0,10);
    const activePayments = db.prepare("SELECT p.*, pl.name as plan_name FROM payments p JOIN plans pl ON pl.id=p.plan_id WHERE p.member_id=? AND p.end_date>=?").all(member_id, today);
    const categories = ["Gym","KaratÃ©","Karate","Box"];
    const newCat = categories.find(c => plan.name.startsWith(c));
    if (newCat) {
      const conflict = activePayments.find(p => p.plan_name.startsWith(newCat) || (newCat==="KaratÃ©"&&p.plan_name.startsWith("Karate")) || (newCat==="Karate"&&p.plan_name.startsWith("KaratÃ©")));
      if (conflict) return res.status(400).json({ error: "Ce membre a dÃ©jÃ  un abonnement "+newCat+" actif jusqu'au "+conflict.end_date+". Impossible d'ajouter le mÃªme type de forfait." });
    }

    const end = new Date(start_date);
    end.setDate(end.getDate() + plan.duration);
    const end_date = end.toISOString().slice(0,10);
    const debt = plan.price - amount_paid;
    const r = db.prepare("INSERT INTO payments (member_id,plan_id,amount_paid,start_date,end_date,notes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)").run(member_id,plan_id,amount_paid,start_date,end_date,notes||null,req.admin.id,now());
    const member = db.prepare("SELECT balance FROM members WHERE id=?").get(member_id);
    db.prepare("UPDATE members SET balance=? WHERE id=?").run((member.balance||0)-debt, member_id);
    res.status(201).json(db.prepare("SELECT p.*, m.full_name, pl.name as plan_name, pl.price as plan_price FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id WHERE p.id=?").get(r.lastInsertRowid));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM payments WHERE id=?").run(req.params.id);
    res.json({ message: "Supprime" });
  } catch(e) { res.status(500).json({ error: e.message }); }
});