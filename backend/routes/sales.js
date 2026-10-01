const router=require("express").Router();
const db=require("../db");
const auth=require("../middleware/auth");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/",auth,(req,res)=>{
  try{
    const{month}=req.query;
    let q="SELECT * FROM sales";
    const params=[];
    if(month){q+=" WHERE created_at LIKE ?";params.push(month+"%");}
    res.json(db.prepare(q+" ORDER BY created_at DESC").all(...params));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post("/",auth,(req,res)=>{
  try{
    const{product_id,product_name,unit_price,quantity,notes}=req.body;
    if(!unit_price||!quantity)return res.status(400).json({error:"Champs manquants"});
    const total=+unit_price*+quantity;
    const r=db.prepare("INSERT INTO sales (product_id,product_name,unit_price,quantity,total,notes,created_at) VALUES (?,?,?,?,?,?,?)").run(product_id||null,product_name||null,+unit_price,+quantity,total,notes||null,now());
    if(product_id){
      const prod=db.prepare("SELECT * FROM products WHERE id=?").get(product_id);
      if(prod&&prod.stock>0)db.prepare("UPDATE products SET stock=stock-? WHERE id=?").run(+quantity,product_id);
    }
    res.status(201).json(db.prepare("SELECT * FROM sales WHERE id=?").get(r.lastInsertRowid));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete("/:id",auth,(req,res)=>{
  try{
    db.prepare("DELETE FROM sales WHERE id=?").run(req.params.id);
    res.json({message:"Supprime"});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports=router;