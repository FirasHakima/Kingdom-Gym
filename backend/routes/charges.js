const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");
router.get("/",auth,(req,res)=>{
  try{const{month}=req.query;let q="SELECT * FROM charges";const params=[];if(month){q+=" WHERE month=?";params.push(month);}res.json(db.prepare(q+" ORDER BY created_at DESC").all(...params));}
  catch(e){res.status(500).json({error:e.message});}
});
router.post("/",auth,(req,res)=>{
  try{const{label,amount,month,notes}=req.body;if(!label||!amount||!month)return res.status(400).json({error:"Champs manquants"});const r=db.prepare("INSERT INTO charges (label,amount,month,notes,created_at) VALUES (?,?,?,?,?)").run(label,+amount,month,notes||null,now());res.status(201).json(db.prepare("SELECT * FROM charges WHERE id=?").get(r.lastInsertRowid));}
  catch(e){res.status(500).json({error:e.message});}
});
router.delete("/:id",auth,(req,res)=>{
  try{db.prepare("DELETE FROM charges WHERE id=?").run(req.params.id);res.json({message:"Supprime"});}
  catch(e){res.status(500).json({error:e.message});}
});
module.exports=router;