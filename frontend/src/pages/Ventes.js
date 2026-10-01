import React,{useEffect,useState} from "react";
import {Plus,Trash2,Edit,Check,X,ShoppingCart,Package} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import {useTheme} from "../ThemeContext";
import {PasswordModal} from "../components/PasswordModal";

export default function Ventes(){
  const[products,setProducts]=useState([]);
  const[sales,setSales]=useState([]);
  const[showAddProduct,setShowAddProduct]=useState(false);
  const[showSell,setShowSell]=useState(null);
  const[editingProduct,setEditingProduct]=useState(null);
  const[productForm,setProductForm]=useState({name:"",price:"",description:"",stock:"0"});
  const[editForm,setEditForm]=useState({});
  const[sellForm,setSellForm]=useState({quantity:"1",notes:""});
  const[pwdModal,setPwdModal]=useState(null);
  const{dark}=useTheme();

  async function load(){
    const[pRes,sRes]=await Promise.all([api.get("/products"),api.get("/sales")]);
    setProducts(pRes.data);setSales(sRes.data);
  }
  useEffect(()=>{load();},[]);

  function deleteProduct(id,name){
    setPwdModal({title:"Supprimer: "+name,message:"Ce produit sera supprime definitivement.",onConfirm:async()=>{
      await api.delete("/products/"+id);toast.success("Produit supprime!");load();
    }});
  }

  function deleteSale(id){
    setPwdModal({title:"Supprimer cette vente",message:"Cette vente sera supprimee definitivement.",onConfirm:async()=>{
      await api.delete("/sales/"+id);toast.success("Vente supprimee!");load();
    }});
  }

  async function addProduct(e){
    e.preventDefault();
    try{await api.post("/products",productForm);toast.success("Produit ajoute!");setShowAddProduct(false);setProductForm({name:"",price:"",description:"",stock:"0"});load();}
    catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  async function saveEdit(id){
    try{await api.put("/products/"+id,editForm);toast.success("Modifie!");setEditingProduct(null);load();}
    catch(err){toast.error("Echec");}
  }

  async function makeSale(e,product){
    e.preventDefault();
    try{
      await api.post("/sales",{product_id:product.id,product_name:product.name,unit_price:product.price,quantity:+sellForm.quantity,notes:sellForm.notes});
      toast.success("Vente enregistree!");setShowSell(null);setSellForm({quantity:"1",notes:""});load();
    }catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  const totalSalesToday=sales.filter(s=>s.created_at?.startsWith(dayjs().format("YYYY-MM-DD"))).reduce((sum,s)=>sum+s.total,0);
  const totalSalesMonth=sales.filter(s=>s.created_at?.startsWith(dayjs().format("YYYY-MM"))).reduce((sum,s)=>sum+s.total,0);
  const inp={width:"100%",background:"var(--input)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",padding:"8px 12px",fontSize:14,boxSizing:"border-box",outline:"none"};

  return(
    <div>
      {pwdModal&&<PasswordModal title={pwdModal.title} message={pwdModal.message} onConfirm={()=>{pwdModal.onConfirm();setPwdModal(null);}} onClose={()=>setPwdModal(null)}/>}
      <div className="page-header">
        <h1 className="page-title">Ventes</h1>
        <button className="btn btn-red" onClick={()=>setShowAddProduct(true)}><Plus size={16}/>Nouveau Produit</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {[
          ["Ventes aujourd hui",totalSalesToday+" DT","#4ade80"],
          ["Ventes ce mois",totalSalesMonth+" DT","#60a5fa"],
          ["Total produits",products.length+" articles","#f59e0b"]
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:20,borderTop:"2px solid "+color}}>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>{label}</div>
            <div style={{fontSize:24,fontWeight:800,color:"var(--text)"}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:"var(--text)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <Package size={16} color="#E31E24"/>Produits ({products.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {products.length===0&&<div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:30,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucun produit.</div>}
            {products.map(p=>(
              <div key={p.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:16}}>
                {editingProduct===p.id?(
                  <div>
                    <input style={{...inp,marginBottom:8}} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Nom"/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <input style={inp} type="number" value={editForm.price} onChange={e=>setEditForm(f=>({...f,price:e.target.value}))} placeholder="Prix" onFocus={e=>e.target.select()}/>
                      <input style={inp} type="number" value={editForm.stock} onChange={e=>setEditForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" onFocus={e=>e.target.select()}/>
                    </div>
                    <input style={{...inp,marginBottom:10}} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="Description"/>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>saveEdit(p.id)} style={{flex:1,padding:"7px",background:"#E31E24",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Check size={12}/>OK</button>
                      <button onClick={()=>setEditingProduct(null)} style={{flex:1,padding:"7px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text)",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><X size={12}/>Annuler</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:"var(--text)"}}>{p.name}</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{p.description||""}</div>
                      <div style={{display:"flex",gap:12,marginTop:6}}>
                        <span style={{fontSize:14,fontWeight:700,color:"#E31E24"}}>{p.price} DT</span>
                        <span style={{fontSize:12,color:p.stock>0?"#4ade80":"#E31E24"}}>Stock: {p.stock}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setShowSell(p)} style={{background:"rgba(74,222,128,0.1)",border:"1px solid #4ade80",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#4ade80",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><ShoppingCart size={13}/>Vendre</button>
                      <button onClick={()=>{setEditingProduct(p.id);setEditForm({name:p.name,price:String(p.price),stock:String(p.stock),description:p.description||""}); }} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 8px",cursor:"pointer",color:"var(--text)",display:"flex",alignItems:"center"}}><Edit size={13}/></button>
                      <button onClick={()=>deleteProduct(p.id,p.name)} style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:8,padding:"6px 8px",cursor:"pointer",color:"#E31E24",display:"flex",alignItems:"center"}}><Trash2 size={13}/></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{fontWeight:700,fontSize:15,color:"var(--text)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <ShoppingCart size={16} color="#E31E24"/>Historique des ventes
          </div>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"var(--card2)"}}>
                {["PRODUIT","QTE","PRIX","TOTAL","DATE",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sales.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:30,color:"var(--muted)",fontSize:13}}>Aucune vente</td></tr>}
                {sales.slice(0,20).map(s=>(
                  <tr key={s.id} style={{borderBottom:"1px solid var(--border)"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 14px",color:"var(--text)",fontWeight:500}}>{s.product_name||"Article"}</td>
                    <td style={{padding:"10px 14px",color:"var(--muted)"}}>{s.quantity}</td>
                    <td style={{padding:"10px 14px",color:"var(--muted)"}}>{s.unit_price} DT</td>
                    <td style={{padding:"10px 14px",color:"#4ade80",fontWeight:700}}>{s.total} DT</td>
                    <td style={{padding:"10px 14px",color:"var(--muted)",fontSize:12}}>{dayjs(s.created_at).format("DD/MM HH:mm")}</td>
                    <td style={{padding:"10px 14px"}}><button onClick={()=>deleteSale(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={13}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddProduct&&(
        <div className="modal-overlay" onClick={()=>setShowAddProduct(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Nouveau Produit</div><button className="btn btn-outline btn-sm" onClick={()=>setShowAddProduct(false)}>✕</button></div>
            <form onSubmit={addProduct}>
              <div className="form-group"><label>Nom *</label><input className="form-control" required value={productForm.name} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))} placeholder="ex: Gants de boxe"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="form-group"><label>Prix (DT) *</label><input className="form-control" type="number" required value={productForm.price} onChange={e=>setProductForm(f=>({...f,price:e.target.value}))} onFocus={e=>e.target.select()} placeholder="0"/></div>
                <div className="form-group"><label>Stock initial</label><input className="form-control" type="number" value={productForm.stock} onChange={e=>setProductForm(f=>({...f,stock:e.target.value}))} onFocus={e=>e.target.select()}/></div>
              </div>
              <div className="form-group"><label>Description</label><input className="form-control" value={productForm.description} onChange={e=>setProductForm(f=>({...f,description:e.target.value}))} placeholder="Optionnel"/></div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}>Ajouter</button>
            </form>
          </div>
        </div>
      )}

      {showSell&&(
        <div className="modal-overlay" onClick={()=>setShowSell(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Vendre - {showSell.name}</div><button className="btn btn-outline btn-sm" onClick={()=>setShowSell(null)}>✕</button></div>
            <div style={{background:"var(--card2)",borderRadius:8,padding:14,marginBottom:20}}>
              <div style={{fontSize:13,color:"var(--muted)"}}>Prix unitaire</div>
              <div style={{fontSize:24,fontWeight:800,color:"#E31E24"}}>{showSell.price} DT</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Stock: {showSell.stock}</div>
            </div>
            <form onSubmit={e=>makeSale(e,showSell)}>
              <div className="form-group"><label>Quantite</label><input className="form-control" type="number" min="1" required value={sellForm.quantity} onChange={e=>setSellForm(f=>({...f,quantity:e.target.value}))} onFocus={e=>e.target.select()}/></div>
              <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid #4ade80",borderRadius:8,padding:12,marginBottom:16,fontSize:14,color:"#4ade80",fontWeight:700}}>
                Total: {(showSell.price*(+sellForm.quantity||0)).toFixed(2)} DT
              </div>
              <div className="form-group"><label>Notes</label><input className="form-control" value={sellForm.notes} onChange={e=>setSellForm(f=>({...f,notes:e.target.value}))} placeholder="Optionnel"/></div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}><ShoppingCart size={16}/>Confirmer la Vente</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}