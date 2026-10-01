const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{
    const{month}=req.query;
    let q="SELECT sp.*,e.role,e.domain FROM salary_payments sp LEFT JOIN employees e ON e.id=sp.employee_id";
    const params=[];
    if(month){q+=" WHERE sp.month=?";params.push(month);}
    res.json(db.prepare(q+" ORDER BY sp.created_at DESC").all(...params));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{employee_id,amount,month,notes}=req.body;
    if(!employee_id||!amount||!month)return res.status(400).json({error:"Champs manquants"});
    const emp=db.prepare("SELECT * FROM employees WHERE id=?").get(employee_id);
    if(!emp)return res.status(404).json({error:"Employe non trouve"});
    // Check if already paid this month
    const existing=db.prepare("SELECT id FROM salary_payments WHERE employee_id=? AND month=?").get(employee_id,month);
    if(existing)return res.status(400).json({error:emp.name+" a deja ete paye pour "+month});
    const r=db.prepare("INSERT INTO salary_payments (employee_id,employee_name,amount,month,notes,created_at) VALUES (?,?,?,?,?,?)").run(employee_id,emp.name,+amount,month,notes||null,now());
    // Auto-create charge in comptabilite
    db.prepare("INSERT INTO charges (label,amount,month,notes,created_at) VALUES (?,?,?,?,?)").run("Salaire - "+emp.name,+amount,month,"Paiement salaire automatique",now());
    res.status(201).json(db.prepare("SELECT * FROM salary_payments WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    const sp=db.prepare("SELECT * FROM salary_payments WHERE id=?").get(req.params.id);
    if(sp){
      // Remove corresponding charge
      db.prepare("DELETE FROM charges WHERE label=? AND month=? AND amount=?").run("Salaire - "+sp.employee_name,sp.month,sp.amount);
    }
    db.prepare("DELETE FROM salary_payments WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;