const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{res.json(db.prepare("SELECT * FROM activities WHERE is_active=1 ORDER BY name").all());}
  catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{name,color,icon}=req.body;
    if(!name)return res.status(400).json({error:"Nom obligatoire"});
    const r=db.prepare("INSERT INTO activities (name,color,icon,created_at) VALUES (?,?,?,?)").run(name,color||"#E31E24",icon||"gym",now());
    res.status(201).json(db.prepare("SELECT * FROM activities WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put("/:id",auth,(req,res)=>{
  try{
    const{name,color,icon}=req.body;
    const a=db.prepare("SELECT * FROM activities WHERE id=?").get(req.params.id);
    if(!a)return res.status(404).json({error:"Non trouve"});
    db.prepare("UPDATE activities SET name=?,color=?,icon=? WHERE id=?").run(name||a.name,color||a.color,icon||a.icon,req.params.id);
    res.json(db.prepare("SELECT * FROM activities WHERE id=?").get(req.params.id));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    const plans=db.prepare("SELECT COUNT(*) as c FROM plans WHERE activity_id=?").get(req.params.id);
    if(plans.c>0)return res.status(400).json({error:"Cette activite a des forfaits. Supprimez les forfaits d abord."});
    db.prepare("DELETE FROM activities WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;