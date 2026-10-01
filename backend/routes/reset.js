const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");

router.post("/reset",auth,(req,res)=>{
  try{
    const{targets}=req.body;
    if(!targets||targets.length===0)return res.status(400).json({error:"Aucune cible selectionnee"});
    const results={};

    if(targets.includes("sales")){
      const c=db.prepare("SELECT COUNT(*) as c FROM sales").get().c;
      db.prepare("DELETE FROM sales").run();
      results.sales=c;
    }
    if(targets.includes("salary_payments")){
      const c=db.prepare("SELECT COUNT(*) as c FROM salary_payments").get().c;
      db.prepare("DELETE FROM salary_payments").run();
      // Also remove salary charges
      db.prepare("DELETE FROM charges WHERE label LIKE ?").run("Salaire -%");
      results.salary_payments=c;
    }
    if(targets.includes("employees")){
      if(!targets.includes("salary_payments")){
        db.prepare("DELETE FROM salary_payments").run();
        db.prepare("DELETE FROM charges WHERE label LIKE ?").run("Salaire -%");
      }
      const c=db.prepare("SELECT COUNT(*) as c FROM employees").get().c;
      db.prepare("DELETE FROM employees").run();
      results.employees=c;
    }
    if(targets.includes("charges")){
      const c=db.prepare("SELECT COUNT(*) as c FROM charges").get().c;
      db.prepare("DELETE FROM charges").run();
      results.charges=c;
    }
    if(targets.includes("payments")){
      const c=db.prepare("SELECT COUNT(*) as c FROM payments").get().c;
      db.prepare("DELETE FROM payments").run();
      db.prepare("UPDATE members SET balance=0").run();
      results.payments=c;
    }
    if(targets.includes("members")){
      if(!targets.includes("payments")){
        db.prepare("DELETE FROM payments").run();
        db.prepare("UPDATE members SET balance=0").run();
      }
      const c=db.prepare("SELECT COUNT(*) as c FROM members").get().c;
      db.prepare("DELETE FROM members").run();
      results.members=c;
    }
    if(targets.includes("plans")){
      const c=db.prepare("SELECT COUNT(*) as c FROM plans").get().c;
      db.prepare("DELETE FROM plans").run();
      results.plans=c;
    }
    if(targets.includes("activities")){
      if(!targets.includes("plans")){
        db.prepare("DELETE FROM plans").run();
      }
      const c=db.prepare("SELECT COUNT(*) as c FROM activities").get().c;
      db.prepare("DELETE FROM activities").run();
      results.activities=c;
    }

    res.json({success:true,results});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;