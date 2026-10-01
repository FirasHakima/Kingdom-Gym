import React,{useEffect,useState} from "react";
import {Plus,Trash2,Lock,TrendingUp,TrendingDown,DollarSign,Download} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {useTheme} from "../ThemeContext";

export default function Comptabilite(){
  const[unlocked,setUnlocked]=useState(false);
  const[pwd,setPwd]=useState("");
  const[loading,setLoading]=useState(false);
  const[month,setMonth]=useState(dayjs().format("YYYY-MM"));
  const[charges,setCharges]=useState([]);
  const[sales,setSales]=useState([]);
  const[payments,setPayments]=useState([]);
  const[showAddCharge,setShowAddCharge]=useState(false);
  const[chargeForm,setChargeForm]=useState({label:"",amount:"",notes:""});
  const[deleteModal,setDeleteModal]=useState({show:false,id:null,type:"",name:""});
  const[deletePwd,setDeletePwd]=useState("");
  const{dark}=useTheme();

  async function unlock(e){
    e.preventDefault();setLoading(true);
    try{
      await api.post("/auth/verify-password",{password:pwd});
      setUnlocked(true);toast.success("Acces autorise!");
    }catch{toast.error("Mot de passe incorrect!");}
    finally{setLoading(false);}
  }

  async function loadData(){
    try{
      const[cRes,sRes,pRes]=await Promise.all([
        api.get("/charges?month="+month),
        api.get("/sales?month="+month),
        api.get("/payments")
      ]);
      setCharges(cRes.data);
      setSales(sRes.data);
      setPayments(pRes.data.filter(p=>p.created_at?.startsWith(month)));
    }catch(e){console.error(e);}
  }

  useEffect(()=>{if(unlocked)loadData();},[unlocked,month]);

  async function addCharge(e){
    e.preventDefault();
    try{
      await api.post("/charges",{...chargeForm,amount:+chargeForm.amount,month});
      toast.success("Charge ajoutee!");setShowAddCharge(false);setChargeForm({label:"",amount:"",notes:""});loadData();
    }catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  async function confirmDelete(){
    try{
      await api.post("/auth/verify-password",{password:deletePwd});
      if(deleteModal.type==="charge")await api.delete("/charges/"+deleteModal.id);
      toast.success("Supprime!");
      setDeleteModal({show:false,id:null,type:"",name:""});setDeletePwd("");
      loadData();
    }catch{toast.error("Mot de passe incorrect!");}
  }

  const totalSubscriptions=payments.reduce((s,p)=>s+(p.amount_paid||0),0);
  const totalSales=sales.reduce((s,p)=>s+(p.total||0),0);
  const totalCharges=charges.reduce((s,c)=>s+(c.amount||0),0);
  const totalRevenue=totalSubscriptions+totalSales;
  const profit=totalRevenue-totalCharges;

  async function exportReport(){
    const wb=XLSX.utils.book_new();
    const summary=[
      ["RAPPORT COMPTABILITE - KINGDOM GYM",""],
      ["Mois",month],["Date",new Date().toLocaleDateString("fr-FR")],["",""],
      ["REVENUS",""],
      ["Abonnements",totalSubscriptions+" DT"],
      ["Ventes produits",totalSales+" DT"],
      ["Total revenus",totalRevenue+" DT"],["",""],
      ["CHARGES",""],
      ...charges.map(c=>[c.label,c.amount+" DT"]),
      ["Total charges",totalCharges+" DT"],["",""],
      ["RESULTAT NET",profit+" DT"],
    ];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),"Resume");
    const chargesData=charges.map(c=>({"Charge":c.label,"Montant":c.amount+" DT","Notes":c.notes||"","Date":c.created_at?.slice(0,10)||""}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(chargesData.length?chargesData:[{"Info":"Aucune charge"}]),"Charges");
    const subsData=payments.map(p=>({"Membre":p.full_name||"","Forfait":p.plan_name||"","Montant":p.amount_paid+" DT","Date":p.created_at?.slice(0,10)||""}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(subsData.length?subsData:[{"Info":"Aucun abonnement"}]),"Abonnements");
    const salesData=sales.map(s=>({"Produit":s.product_name||"","Qte":s.quantity,"Prix":s.unit_price+" DT","Total":s.total+" DT","Date":s.created_at?.slice(0,10)||""}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(salesData.length?salesData:[{"Info":"Aucune vente"}]),"Ventes");
    XLSX.writeFile(wb,"KingdomGym-Comptabilite-"+month+".xlsx");
    toast.success("Export reussi!");
  }

  if(!unlocked){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:40,width:"100%",maxWidth:400,textAlign:"center",borderTop:"3px solid #E31E24"}}>
          <div style={{width:64,height:64,background:"rgba(227,30,36,0.1)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Lock size={28} color="#E31E24"/></div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Comptabilite</h2>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Cette page est protegee. Entrez votre mot de passe pour continuer.</p>
          <form onSubmit={unlock}>
            <input className="form-control" type="password" autoFocus value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mot de passe administrateur" style={{marginBottom:16,textAlign:"center"}}/>
            <button className="btn btn-red" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center"}}><Lock size={14}/>{loading?"Verification...":"Acceder"}</button>
          </form>
        </div>
      </div>
    );
  }

  return(
    <div>
      <div className="page-header">
        <h1 className="page-title">Comptabilite</h1>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",padding:"8px 12px",fontSize:14,outline:"none"}}/>
          <button onClick={exportReport} className="btn btn-sm" style={{background:"rgba(74,222,128,0.1)",border:"1px solid #4ade80",color:"#4ade80"}}><Download size={14}/>Exporter</button>
          <button onClick={()=>setShowAddCharge(true)} className="btn btn-red btn-sm"><Plus size={14}/>Ajouter charge</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Revenus abonnements",value:totalSubscriptions+" DT",color:"#4ade80",icon:TrendingUp},
          {label:"Revenus ventes",value:totalSales+" DT",color:"#60a5fa",icon:DollarSign},
          {label:"Total charges",value:totalCharges+" DT",color:"#E31E24",icon:TrendingDown},
          {label:"Resultat net",value:profit+" DT",color:profit>=0?"#4ade80":"#E31E24",icon:DollarSign},
        ].map(({label,value,color,icon:Icon})=>(
          <div key={label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:20,borderTop:"2px solid "+color}}>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* Abonnements */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:"var(--text)"}}>Abonnements</span>
            <span style={{fontSize:14,fontWeight:700,color:"#4ade80"}}>{totalSubscriptions} DT</span>
          </div>
          <div style={{maxHeight:300,overflowY:"auto"}}>
            {payments.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucun abonnement ce mois</div>}
            {payments.map(p=>(
              <div key={p.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
                <div><div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{p.full_name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{p.plan_name}</div></div>
                <div style={{fontSize:13,fontWeight:700,color:"#4ade80"}}>{p.amount_paid} DT</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ventes */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:"var(--text)"}}>Ventes produits</span>
            <span style={{fontSize:14,fontWeight:700,color:"#60a5fa"}}>{totalSales} DT</span>
          </div>
          <div style={{maxHeight:300,overflowY:"auto"}}>
            {sales.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucune vente ce mois</div>}
            {sales.map(s=>(
              <div key={s.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
                <div><div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{s.product_name}</div><div style={{fontSize:11,color:"var(--muted)"}}>x{s.quantity}</div></div>
                <div style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>{s.total} DT</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charges */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:"var(--text)"}}>Charges</span>
            <span style={{fontSize:14,fontWeight:700,color:"#E31E24"}}>{totalCharges} DT</span>
          </div>
          <div style={{maxHeight:300,overflowY:"auto"}}>
            {charges.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucune charge ce mois</div>}
            {charges.map(c=>(
              <div key={c.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{c.label}</div>{c.notes&&<div style={{fontSize:11,color:"var(--muted)"}}>{c.notes}</div>}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#E31E24"}}>{c.amount} DT</span>
                  <button onClick={()=>{setDeleteModal({show:true,id:c.id,type:"charge",name:c.label});setDeletePwd("");}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:2,display:"flex"}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit summary */}
      <div style={{background:profit>=0?"rgba(74,222,128,0.05)":"rgba(227,30,36,0.05)",border:"1px solid "+(profit>=0?"#4ade80":"#E31E24"),borderRadius:12,padding:20,marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:4}}>Resultat net du mois {month}</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>Revenus ({totalRevenue} DT) - Charges ({totalCharges} DT)</div>
        </div>
        <div style={{fontSize:36,fontWeight:900,color:profit>=0?"#4ade80":"#E31E24"}}>{profit>=0?"+":""}{profit} DT</div>
      </div>

      {/* Add charge modal */}
      {showAddCharge&&(
        <div className="modal-overlay" onClick={()=>setShowAddCharge(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Ajouter une Charge</div><button className="btn btn-outline btn-sm" onClick={()=>setShowAddCharge(false)}>✕</button></div>
            <form onSubmit={addCharge}>
              <div className="form-group"><label>Libelle *</label><input className="form-control" required value={chargeForm.label} onChange={e=>setChargeForm(f=>({...f,label:e.target.value}))} placeholder="ex: Loyer, Electricite, Salaire..."/></div>
              <div className="form-group"><label>Montant (DT) *</label><input className="form-control" type="number" required value={chargeForm.amount} onChange={e=>setChargeForm(f=>({...f,amount:e.target.value}))} onFocus={e=>e.target.select()} placeholder="0"/></div>
              <div className="form-group"><label>Notes</label><input className="form-control" value={chargeForm.notes} onChange={e=>setChargeForm(f=>({...f,notes:e.target.value}))} placeholder="Optionnel"/></div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}>Ajouter la Charge</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete password modal */}
      {deleteModal.show&&(
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:380}}>
            <div className="modal-header"><div className="modal-title">Confirmation requise</div></div>
            <div style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:"#E31E24"}}>Supprimer: <strong>{deleteModal.name}</strong></div>
            <div className="form-group"><label>Mot de passe</label><input className="form-control" type="password" autoFocus value={deletePwd} onChange={e=>setDeletePwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&confirmDelete()} placeholder="Mot de passe"/></div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={confirmDelete} className="btn btn-red" style={{flex:1,justifyContent:"center"}}>Confirmer</button>
              <button onClick={()=>{setDeleteModal({show:false,id:null,type:"",name:""});setDeletePwd("");}} className="btn btn-outline" style={{flex:1,justifyContent:"center"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}