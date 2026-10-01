const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{
    const plans=db.prepare("SELECT p.*,a.name as activity_name,a.color as activity_color,a.icon as activity_icon FROM plans p LEFT JOIN activities a ON a.id=p.activity_id WHERE p.is_active=1 ORDER BY a.name,p.duration").all();
    res.json(plans);
  }catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{name,duration,price,description,activity_id}=req.body;
    if(!name||!duration||!price)return res.status(400).json({error:"Champs manquants"});
    const r=db.prepare("INSERT INTO plans (name,duration,price,description,activity_id,created_at) VALUES (?,?,?,?,?,?)").run(name,+duration,+price,description||null,activity_id||null,now());
    res.status(201).json(db.prepare("SELECT * FROM plans WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put("/:id",auth,(req,res)=>{
  try{
    const{name,duration,price,description,is_active}=req.body;
    const p=db.prepare("SELECT * FROM plans WHERE id=?").get(req.params.id);
    if(!p)return res.status(404).json({error:"Non trouve"});
    db.prepare("UPDATE plans SET name=?,duration=?,price=?,description=?,is_active=? WHERE id=?").run(name??p.name,duration??p.duration,price??p.price,description??p.description,is_active??p.is_active,req.params.id);
    res.json(db.prepare("SELECT * FROM plans WHERE id=?").get(req.params.id));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    const payments=db.prepare("SELECT COUNT(*) as c FROM payments WHERE plan_id=?").get(req.params.id);
    if(payments.c>0)return res.status(400).json({error:"Ce forfait a des paiements associes"});
    db.prepare("DELETE FROM plans WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;