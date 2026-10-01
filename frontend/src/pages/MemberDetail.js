import React,{useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {ArrowLeft,Plus,CreditCard,Clock} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import AddPaymentModal from "../components/AddPaymentModal";
import {PasswordModal} from "../components/PasswordModal";

export default function MemberDetail(){
  const{id}=useParams();
  const navigate=useNavigate();
  const[member,setMember]=useState(null);
  const[showPayment,setShowPayment]=useState(false);
  const[showDebt,setShowDebt]=useState(false);
  const[debtForm,setDebtForm]=useState({amount:"",notes:""});
  const[pwdModal,setPwdModal]=useState(null);

  async function load(){
    try{const{data}=await api.get("/members/"+id);setMember(data);}
    catch{toast.error("Non trouve");navigate("/members");}
  }
  useEffect(()=>{load();},[id]);

  function handleDelete(){
    setPwdModal({title:"Supprimer "+member?.full_name,message:"Cette action supprimera le membre et tout son historique.",onConfirm:async()=>{
      await api.delete("/members/"+id);
      toast.success("Membre supprime!");
      navigate("/members");
    }});
  }

  async function handleDebtPayment(e){
    e.preventDefault();
    try{
      await api.post("/members/"+id+"/pay-debt",{amount:+debtForm.amount,notes:debtForm.notes});
      toast.success("Paiement enregistre!");
      setShowDebt(false);setDebtForm({amount:"",notes:""});load();
    }catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  if(!member)return <div style={{padding:40,color:"var(--muted)",textAlign:"center"}}>Chargement...</div>;

  const latest=member.payments[0];
  const isActive=latest&&dayjs(latest.end_date).isAfter(dayjs());
  const balance=member.balance||0;
  const hasDebt=balance<0;
  const daysLeft=latest?Math.max(0,dayjs(latest.end_date).diff(dayjs(),"day")):0;

  return(
    <div>
      {pwdModal&&<PasswordModal title={pwdModal.title} message={pwdModal.message} onConfirm={()=>{pwdModal.onConfirm();setPwdModal(null);}} onClose={()=>setPwdModal(null)}/>}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
        <button className="btn btn-outline btn-sm" onClick={()=>navigate("/members")} style={{display:"flex",alignItems:"center",gap:6}}><ArrowLeft size={15}/>Retour</button>
        <div style={{flex:1}}>
          <h1 style={{fontSize:24,fontWeight:900,color:"var(--text)",margin:0}}>{member.full_name}</h1>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>Membre depuis {dayjs(member.created_at).format("MMMM YYYY")}</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {hasDebt&&<button className="btn btn-sm" onClick={()=>setShowDebt(true)} style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",color:"#E31E24"}}><CreditCard size={14}/>Payer dette</button>}
          <button className="btn btn-red btn-sm" onClick={()=>setShowPayment(true)}><Plus size={14}/>Nouvel abonnement</button>
          <button className="btn btn-sm" onClick={handleDelete} style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",color:"#E31E24"}}>Supprimer</button>
        </div>
      </div>

      {/* Info cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>

        {/* Member info */}
        <div style={{background:"var(--card)",borderLeft:"3px solid #60a5fa",borderRadius:"0 12px 12px 0",padding:20,border:"1px solid var(--border)",borderLeft:"3px solid #60a5fa"}}>
          <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,marginBottom:14,fontWeight:700}}>INFORMATIONS</div>
          {[["Telephone",member.phone],["Email",member.email],["Genre",member.gender==="male"?"Homme":"Femme"],["Inscription",dayjs(member.created_at).format("DD/MM/YYYY")]].map(([k,v])=>v&&(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
              <span style={{color:"var(--muted)"}}>{k}</span>
              <span style={{fontWeight:600,color:"var(--text)"}}>{v}</span>
            </div>
          ))}
          {member.notes&&<div style={{marginTop:12,padding:"10px 12px",background:"var(--card2)",borderRadius:8,fontSize:12,color:"var(--muted)",borderLeft:"3px solid #60a5fa"}}>{member.notes}</div>}
        </div>

        {/* Current subscription */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderLeft:"3px solid "+(isActive?"#4ade80":"#E31E24"),borderRadius:"0 12px 12px 0",padding:20}}>
          <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,marginBottom:14,fontWeight:700}}>ABONNEMENT ACTUEL</div>
          {latest?(
            <div>
              <div style={{fontSize:17,fontWeight:800,color:isActive?"#4ade80":"#E31E24",marginBottom:14}}>{latest.plan_name}</div>
              {[["Debut",dayjs(latest.start_date).format("DD/MM/YYYY")],["Fin",dayjs(latest.end_date).format("DD/MM/YYYY")],["Jours restants",daysLeft+" jours"],["Paye",latest.amount_paid+" DT"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                  <span style={{color:"var(--muted)"}}>{k}</span>
                  <span style={{fontWeight:600,color:"var(--text)"}}>{v}</span>
                </div>
              ))}
            </div>
          ):(
            <div style={{textAlign:"center",padding:"20px 0",color:"var(--muted)"}}>
              <div style={{fontSize:13,marginBottom:12}}>Aucun abonnement</div>
              <button className="btn btn-red btn-sm" onClick={()=>setShowPayment(true)}><Plus size={13}/>Ajouter</button>
            </div>
          )}
        </div>

        {/* Balance */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderLeft:"3px solid "+(hasDebt?"#E31E24":balance>0?"#4ade80":"var(--border)"),borderRadius:"0 12px 12px 0",padding:20}}>
          <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,marginBottom:14,fontWeight:700}}>SOLDE DU COMPTE</div>
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:48,fontWeight:900,color:hasDebt?"#E31E24":balance>0?"#4ade80":"var(--muted)",lineHeight:1}}>
              {balance>0?"+":""}{balance}
            </div>
            <div style={{fontSize:14,color:"var(--muted)",marginTop:4}}>DT</div>
            <div style={{fontSize:12,marginTop:8,color:hasDebt?"#E31E24":"var(--muted)",fontWeight:hasDebt?600:400}}>
              {hasDebt?"Doit "+Math.abs(balance)+" DT":balance>0?"Credit disponible":"Solde"}
            </div>
          </div>
          {hasDebt&&(
            <button onClick={()=>setShowDebt(true)} style={{width:"100%",padding:"10px",background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:8,color:"#E31E24",cursor:"pointer",fontWeight:600,fontSize:13}}>
              Enregistrer un paiement
            </button>
          )}
        </div>
      </div>

      {/* History */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
          <Clock size={15} color="#E31E24"/>
          <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Historique complet</span>
          <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{member.payments.length} enregistrement(s)</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"var(--card2)"}}>
              {["FORFAIT","DEBUT","FIN","PRIX","PAYE","DETTE","STATUT","DATE"].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {member.payments.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:30,color:"var(--muted)"}}>Aucun historique</td></tr>}
              {member.payments.map((p,i)=>{
                const debt=(p.plan_price||p.amount_paid)-p.amount_paid;
                const expired=dayjs(p.end_date).isBefore(dayjs());
                return(
                  <tr key={p.id} style={{borderBottom:"1px solid var(--border)",background:i===0?"rgba(227,30,36,0.03)":"transparent"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background=i===0?"rgba(227,30,36,0.03)":"transparent"}>
                    <td style={{padding:"12px 16px",fontWeight:600,color:"var(--text)",whiteSpace:"nowrap"}}>
                      {p.plan_name}
                      {i===0&&<span style={{marginLeft:8,fontSize:10,background:"rgba(227,30,36,0.15)",color:"#E31E24",padding:"2px 6px",borderRadius:4,fontWeight:700}}>RECENT</span>}
                    </td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"var(--muted)",whiteSpace:"nowrap"}}>{dayjs(p.start_date).format("DD/MM/YYYY")}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:expired?"#E31E24":"#4ade80",whiteSpace:"nowrap"}}>{dayjs(p.end_date).format("DD/MM/YYYY")}</td>
                    <td style={{padding:"12px 16px",color:"var(--muted)"}}>{p.plan_price||p.amount_paid} DT</td>
                    <td style={{padding:"12px 16px",color:"#4ade80",fontWeight:600}}>{p.amount_paid} DT</td>
                    <td style={{padding:"12px 16px",color:debt>0?"#E31E24":"var(--muted)",fontWeight:debt>0?700:400}}>{debt>0?"-"+debt+" DT":"0 DT"}</td>
                    <td style={{padding:"12px 16px"}}>{expired?<span style={{background:"rgba(227,30,36,0.1)",color:"#E31E24",border:"1px solid rgba(227,30,36,0.3)",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600}}>Expire</span>:<span style={{background:"rgba(74,222,128,0.1)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600}}>Actif</span>}</td>
                    <td style={{padding:"12px 16px",fontSize:12,color:"var(--muted)",whiteSpace:"nowrap"}}>{dayjs(p.created_at).format("DD/MM/YYYY")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showPayment&&<AddPaymentModal memberId={member.id} memberName={member.full_name} onClose={()=>{setShowPayment(false);load();}}/>}

      {showDebt&&(
        <div className="modal-overlay" onClick={()=>setShowDebt(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Paiement de dette</div>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowDebt(false)}>X</button>
            </div>
            <div style={{background:"rgba(227,30,36,0.08)",border:"1px solid rgba(227,30,36,0.3)",borderRadius:8,padding:14,marginBottom:20,fontSize:13,color:"#E31E24"}}>
              {member.full_name} doit <strong>{Math.abs(balance)} DT</strong>
            </div>
            <form onSubmit={handleDebtPayment}>
              <div className="form-group"><label>Montant paye (DT)</label><input className="form-control" type="number" required max={Math.abs(balance)} value={debtForm.amount} onChange={e=>setDebtForm(f=>({...f,amount:e.target.value}))} onFocus={e=>e.target.select()} placeholder={"Max: "+Math.abs(balance)+" DT"}/></div>
              <div className="form-group"><label>Notes</label><input className="form-control" value={debtForm.notes} onChange={e=>setDebtForm(f=>({...f,notes:e.target.value}))} placeholder="Optionnel"/></div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}>Confirmer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}