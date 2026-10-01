const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);

    const total_members = db.prepare("SELECT COUNT(*) as c FROM members").get().c;
    const active_members = db.prepare("SELECT COUNT(*) as c FROM payments WHERE end_date >= date('now')").get().c;
    const expired_members = db.prepare("SELECT COUNT(*) as c FROM members m WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.member_id=m.id AND p.end_date>=date('now'))").get().c;
    const monthly_revenue = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as r FROM payments WHERE created_at >= ? AND created_at <= ?").get(monthStart+" 00:00:00", monthEnd+" 23:59:59").r;

    const expiring_soon = db.prepare("SELECT p.id, p.member_id, p.end_date, m.full_name, pl.name as plan_name FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id WHERE p.end_date >= date('now') AND p.end_date <= date('now','+7 days') ORDER BY p.end_date ASC").all();

    const monthly_chart = [];
    for(let i=5; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
      const end = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
      const revenue = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as r FROM payments WHERE created_at >= ? AND created_at <= ?").get(start+" 00:00:00", end+" 23:59:59").r;
      const monthName = d.toLocaleDateString("fr-FR", {month:"short"});
      monthly_chart.push({ month: monthName, revenue });
    }

    res.json({ total_members, active_members, expired_members, monthly_revenue, expiring_soon, monthly_chart });
  } catch(e) { console.error("DASHBOARD ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

module.exports = router;