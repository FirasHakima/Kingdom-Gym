const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{res.json(db.prepare("SELECT * FROM products ORDER BY name").all());}
  catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{name,price,description,stock}=req.body;
    if(!name||!price)return res.status(400).json({error:"Nom et prix obligatoires"});
    const r=db.prepare("INSERT INTO products (name,price,description,stock,created_at) VALUES (?,?,?,?,?)").run(name,+price,description||null,+stock||0,now());
    res.status(201).json(db.prepare("SELECT * FROM products WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put("/:id",auth,(req,res)=>{
  try{
    const{name,price,description,stock}=req.body;
    const p=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);
    if(!p)return res.status(404).json({error:"Non trouve"});
    db.prepare("UPDATE products SET name=?,price=?,description=?,stock=? WHERE id=?").run(name??p.name,price??p.price,description??p.description,stock??p.stock,req.params.id);
    res.json(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;