const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const XLSX = require("xlsx");
const now = () => new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/export", auth, (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    const members = db.prepare("SELECT * FROM members").all();
    const membersData = members.length > 0 ? members.map(m => ({
      "ID": m.id,
      "Full Name": m.full_name||"",
      "Phone": m.phone||"",
      "Email": m.email||"",
      "Gender": m.gender||"",
      "Birth Date": m.birth_date||"",
      "Notes": m.notes||"",
      "Balance": m.balance||0,
      "Created At": m.created_at||""
    })) : [{"ID":"","Full Name":"","Phone":"","Email":"","Gender":"","Birth Date":"","Notes":"","Balance":"","Created At":""}];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersData), "Members");

    const plans = db.prepare("SELECT * FROM plans WHERE is_active=1").all();
    const plansData = plans.length > 0 ? plans.map(p => ({
      "ID": p.id,
      "Name": p.name||"",
      "Duration (days)": p.duration||0,
      "Price (DT)": p.price||0,
      "Description": p.description||""
    })) : [{"ID":"","Name":"","Duration (days)":"","Price (DT)":"","Description":""}];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plansData), "Plans");

    const payments = db.prepare("SELECT p.*, m.full_name, pl.name as plan_name, pl.price as plan_price FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id ORDER BY p.created_at DESC").all();
    const paymentsData = payments.length > 0 ? payments.map(p => ({
      "ID": p.id,
      "Member": p.full_name||"",
      "Plan": p.plan_name||"",
      "Plan Price (DT)": p.plan_price||0,
      "Amount Paid (DT)": p.amount_paid||0,
      "Debt (DT)": (p.plan_price||0) - (p.amount_paid||0),
      "Start Date": p.start_date||"",
      "End Date": p.end_date||"",
      "Notes": p.notes||"",
      "Created At": p.created_at||""
    })) : [{"ID":"","Member":"","Plan":"","Plan Price (DT)":"","Amount Paid (DT)":"","Debt (DT)":"","Start Date":"","End Date":"","Notes":"","Created At":""}];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData), "Payments");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = "KingdomGym-Data-" + new Date().toISOString().slice(0,10) + ".xlsx";
    res.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Length", buf.length);
    res.end(buf);
  } catch(e) { console.error("EXPORT ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.post("/import", auth, (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "No file data" });
    const buf = Buffer.from(data, "base64");
    const wb = XLSX.read(buf, { type: "buffer" });
    let imported = { members: 0, plans: 0, payments: 0, errors: [] };

    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) return;
      const name = sheetName.toLowerCase();
      const keys = Object.keys(rows[0]).map(k => k.toLowerCase());
      const isMembers = keys.some(k => k.includes("full name")||k.includes("fullname")||k.includes("nom"));
      const isPlans = keys.some(k => k.includes("duration")||k.includes("duree"));
      const isPayments = keys.some(k => k.includes("amount paid")||k.includes("start date"));

      if (isMembers||name.includes("member")) {
        rows.forEach(row => {
          try {
            const fullName=row["Full Name"]||row["fullname"]||row["Nom"]||row["name"]||row["NAME"];
            if (!fullName) return;
            const exists=db.prepare("SELECT id FROM members WHERE full_name=?").get(String(fullName));
            if (!exists) {
              db.prepare("INSERT INTO members (full_name,phone,email,gender,birth_date,notes,balance,created_at) VALUES (?,?,?,?,?,?,0,?)").run(String(fullName),row["Phone"]?String(row["Phone"]):null,row["Email"]?String(row["Email"]):null,row["Gender"]?String(row["Gender"]):"male",row["Birth Date"]?String(row["Birth Date"]):null,row["Notes"]?String(row["Notes"]):null,now());
              imported.members++;
            }
          } catch(e) { imported.errors.push("Member: "+e.message); }
        });
      }

      if (isPlans||name.includes("plan")) {
        rows.forEach(row => {
          try {
            const planName=row["Name"]||row["name"]||row["Plan"]||row["Nom"];
            const price=row["Price (DT)"]||row["Price"]||row["price"]||row["Prix"];
            const duration=row["Duration (days)"]||row["Duration"]||row["duration"]||30;
            if (!planName||!price) return;
            const exists=db.prepare("SELECT id FROM plans WHERE name=?").get(String(planName));
            if (!exists) {
              db.prepare("INSERT INTO plans (name,duration,price,description,created_at) VALUES (?,?,?,?,?)").run(String(planName),+duration,+price,row["Description"]?String(row["Description"]):null,now());
              imported.plans++;
            }
          } catch(e) { imported.errors.push("Plan: "+e.message); }
        });
      }

      if (isPayments||name.includes("payment")) {
        rows.forEach(row => {
          try {
            const memberName=row["Member"]||row["member"]||row["Full Name"];
            const planName=row["Plan"]||row["plan"];
            const amountPaid=row["Amount Paid (DT)"]||row["Amount Paid"]||row["amount_paid"];
            const startDate=row["Start Date"]||row["start_date"];
            if (!memberName||!planName||!amountPaid||!startDate) return;
            const member=db.prepare("SELECT id FROM members WHERE full_name LIKE ?").get("%"+memberName+"%");
            const plan=db.prepare("SELECT * FROM plans WHERE name LIKE ?").get("%"+planName+"%");
            if (!member||!plan) return;
            const end=new Date(startDate);
            end.setDate(end.getDate()+plan.duration);
            const endDate=end.toISOString().slice(0,10);
            db.prepare("INSERT INTO payments (member_id,plan_id,amount_paid,start_date,end_date,notes,created_at) VALUES (?,?,?,?,?,?,?)").run(member.id,plan.id,+amountPaid,String(startDate),endDate,row["Notes"]?String(row["Notes"]):null,now());
            imported.payments++;
          } catch(e) { imported.errors.push("Payment: "+e.message); }
        });
      }
    });

    res.json({ success: true, imported });
  } catch(e) { console.error("IMPORT ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

module.exports = router;