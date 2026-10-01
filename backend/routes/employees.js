const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{res.json(db.prepare("SELECT * FROM employees ORDER BY name").all());}
  catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{name,role,domain,salary,phone,notes}=req.body;
    if(!name||!role||!salary)return res.status(400).json({error:"Champs manquants"});
    const r=db.prepare("INSERT INTO employees (name,role,domain,salary,phone,notes,created_at) VALUES (?,?,?,?,?,?,?)").run(name,role,domain||null,+salary,phone||null,notes||null,now());
    res.status(201).json(db.prepare("SELECT * FROM employees WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put("/:id",auth,(req,res)=>{
  try{
    const{name,role,domain,salary,phone,notes,is_active}=req.body;
    const e=db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);
    if(!e)return res.status(404).json({error:"Non trouve"});
    db.prepare("UPDATE employees SET name=?,role=?,domain=?,salary=?,phone=?,notes=?,is_active=? WHERE id=?").run(name??e.name,role??e.role,domain??e.domain,salary??e.salary,phone??e.phone,notes??e.notes,is_active??e.is_active,req.params.id);
    res.json(db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    db.prepare("DELETE FROM salary_payments WHERE employee_id=?").run(req.params.id);
    db.prepare("DELETE FROM employees WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;