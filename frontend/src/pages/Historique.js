import React,{useEffect,useState} from "react";
import {Trash2,Clock,Users,CreditCard,ShoppingCart,Filter,DollarSign,Lock} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import {PasswordModal} from "../components/PasswordModal";

export default function Historique(){
  const[members,setMembers]=useState([]);
  const[employees,setEmployees]=useState([]);
  const[payments,setPayments]=useState([]);
  const[sales,setSales]=useState([]);
  const[salaryPayments,setSalaryPayments]=useState([]);
  const[activeTab,setActiveTab]=useState("members");
  const[pwdModal,setPwdModal]=useState(null);
  const[filter,setFilter]=useState("");

  const[unlocked,setUnlocked]=useState(false);
  const[pwd,setPwd]=useState("");
  const[loading,setLoading]=useState(false);

  async function load(){
    try{
      const[mRes,pRes,sRes,spRes,eRes]=await Promise.all([api.get("/members"),api.get("/payments"),api.get("/sales"),api.get("/salary-payments"),api.get("/employees")]);
      setMembers(mRes.data);
      setPayments(pRes.data);
      setSales(sRes.data);
      setSalaryPayments(spRes.data);
      setEmployees(eRes.data);
    }catch(e){toast.error("Erreur de chargement");}
  }

  async function unlock(e){
    e.preventDefault();
    setLoading(true);
    try{
      await api.post("/auth/verify-password",{password:pwd});
      setUnlocked(true);
      toast.success("Acces autorise!");
    }catch{
      toast.error("Mot de passe incorrect!");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{if(unlocked)load();},[unlocked]);

  const expiredMembers=members.filter(m=>m.subscription_status==="expired"||m.subscription_status==="no_plan");
  const allPayments=payments;
  const allSales=sales;

  function deletePayment(id){
    setPwdModal({title:"Supprimer ce paiement",message:"Ce paiement sera supprime de l historique.",onConfirm:async()=>{
      try{await api.delete("/payments/"+id);toast.success("Supprime!");load();}
      catch(e){toast.error("Echec");}
    }});
  }

  function deleteSale(id){
    setPwdModal({title:"Supprimer cette vente",message:"Cette vente sera supprimee de l historique.",onConfirm:async()=>{
      try{await api.delete("/sales/"+id);toast.success("Supprime!");load();}
      catch(e){toast.error("Echec");}
    }});
  }

  function deleteExpiredMember(id,name){
    setPwdModal({title:"Supprimer: "+name,message:"Ce membre et tout son historique seront supprimes.",onConfirm:async()=>{
      try{await api.delete("/members/"+id);toast.success("Supprime!");load();}
      catch(e){toast.error("Echec");}
    }});
  }

  function deleteSalaryPayment(id,name){
    setPwdModal({title:"Supprimer paiement de "+name,message:"Le paiement sera supprime de l historique.",onConfirm:async()=>{
      try{await api.delete("/salary-payments/"+id);toast.success("Supprime!");load();}
      catch(e){toast.error("Echec");}
    }});
  }

  const tabs=[
    {id:"members",label:"Membres expires",icon:Users,count:expiredMembers.length,color:"#E31E24"},
    {id:"payments",label:"Historique paiements",icon:CreditCard,count:allPayments.length,color:"#4ade80"},
    {id:"sales",label:"Historique ventes",icon:ShoppingCart,count:allSales.length,color:"#60a5fa"},
    {id:"salaries",label:"Historique salaires",icon:DollarSign,count:salaryPayments.length,color:"#f59e0b"},
  ];

  const filteredMembers=expiredMembers.filter(m=>!filter||m.full_name?.toLowerCase().includes(filter.toLowerCase()));
  const filteredPayments=allPayments.filter(p=>!filter||p.full_name?.toLowerCase().includes(filter.toLowerCase()));
  const filteredSales=allSales.filter(s=>!filter||s.product_name?.toLowerCase().includes(filter.toLowerCase()));
  const filteredSalaries=salaryPayments.filter(s=>{
    const name=employees.find(e=>e.id===s.employee_id)?.name||s.employee_name||"";
    return !filter||name.toLowerCase().includes(filter.toLowerCase());
  });

if(!unlocked){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:40,width:"100%",maxWidth:400,textAlign:"center",borderTop:"3px solid #E31E24"}}>
          <div style={{width:64,height:64,background:"rgba(227,30,36,0.1)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Lock size={28} color="#E31E24"/></div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Historique</h2>
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
      {pwdModal&&<PasswordModal title={pwdModal.title} message={pwdModal.message} onConfirm={()=>{pwdModal.onConfirm();setPwdModal(null);}} onClose={()=>setPwdModal(null)}/>}
      <div className="page-header">
        <h1 className="page-title">Historique</h1>
        <div style={{position:"relative"}}>
          <Filter size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)"}}/>
          <input className="form-control" style={{paddingLeft:34,width:220}} placeholder="Rechercher..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:10,border:"1px solid",borderColor:activeTab===tab.id?tab.color:"var(--border)",background:activeTab===tab.id?"rgba(227,30,36,0.08)":"var(--card)",color:activeTab===tab.id?tab.color:"var(--muted)",fontWeight:activeTab===tab.id?700:500,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>
            <tab.icon size={15}/>
            {tab.label}
            <span style={{background:activeTab===tab.id?tab.color:"var(--card2)",color:activeTab===tab.id?"#fff":"var(--muted)",borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:700}}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Expired Members */}
      {activeTab==="members"&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <Clock size={15} color="#E31E24"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Membres avec abonnement expire</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{filteredMembers.length} membre(s)</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"var(--card2)"}}>
              {["MEMBRE","TELEPHONE","DERNIER FORFAIT","FIN ABONNEMENT","DETTE","INSCRIT LE",""].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredMembers.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:30,color:"var(--muted)"}}>Aucun membre expire</td></tr>}
              {filteredMembers.map(m=>(
                <tr key={m.id} style={{borderBottom:"1px solid var(--border)"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"12px 16px"}}><div style={{fontWeight:600,color:"var(--text)"}}>{m.full_name}</div>{m.email&&<div style={{fontSize:11,color:"var(--muted)"}}>{m.email}</div>}</td>
                  <td style={{padding:"12px 16px",color:"var(--muted)"}}>{m.phone||"â€”"}</td>
                  <td style={{padding:"12px 16px",color:"var(--muted)",fontSize:13}}>{m.plan_name||"â€”"}</td>
                  <td style={{padding:"12px 16px",color:"#E31E24",fontSize:13}}>{m.subscription_end?dayjs(m.subscription_end).format("DD/MM/YYYY"):"â€”"}</td>
                  <td style={{padding:"12px 16px",color:(m.balance||0)<0?"#E31E24":"var(--muted)",fontWeight:(m.balance||0)<0?700:400}}>{(m.balance||0)<0?Math.abs(m.balance||0)+" DT":"â€”"}</td>
                  <td style={{padding:"12px 16px",fontSize:12,color:"var(--muted)"}}>{dayjs(m.created_at).format("DD/MM/YYYY")}</td>
                  <td style={{padding:"12px 16px"}}>
                    <button onClick={()=>deleteExpiredMember(m.id,m.full_name)} style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#E31E24",display:"flex",alignItems:"center"}}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment history */}
      {activeTab==="payments"&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <CreditCard size={15} color="#4ade80"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Tous les paiements</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{filteredPayments.length} paiement(s)</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"var(--card2)"}}>
              {["MEMBRE","FORFAIT","PRIX","PAYE","DETTE","DEBUT","FIN","DATE",""].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredPayments.length===0&&<tr><td colSpan={9} style={{textAlign:"center",padding:30,color:"var(--muted)"}}>Aucun paiement</td></tr>}
              {filteredPayments.map(p=>{
                const debt=(p.plan_price||0)-(p.amount_paid||0);
                const expired=dayjs(p.end_date).isBefore(dayjs());
                return(
                  <tr key={p.id} style={{borderBottom:"1px solid var(--border)"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"11px 16px",fontWeight:600,color:"var(--text)"}}>{p.full_name}</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:13}}>{p.plan_name}</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)"}}>{p.plan_price} DT</td>
                    <td style={{padding:"11px 16px",color:"#4ade80",fontWeight:600}}>{p.amount_paid} DT</td>
                    <td style={{padding:"11px 16px",color:debt>0?"#E31E24":"var(--muted)",fontWeight:debt>0?700:400}}>{debt>0?"-"+debt+" DT":"0 DT"}</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:12}}>{dayjs(p.start_date).format("DD/MM/YYYY")}</td>
                    <td style={{padding:"11px 16px",color:expired?"#E31E24":"#4ade80",fontSize:12}}>{dayjs(p.end_date).format("DD/MM/YYYY")}</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:12}}>{p.created_at?.slice(0,10)||""}</td>
                    <td style={{padding:"11px 16px"}}>
                      <button onClick={()=>deletePayment(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary history */}
      {activeTab==="salaries"&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <DollarSign size={15} color="#f59e0b"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Historique des salaires</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{filteredSalaries.length} paiement(s)</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"var(--card2)"}}>
              {["EMPLOYE","MONTANT","MOIS","DATE",""].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredSalaries.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:30,color:"var(--muted)"}}>Aucun paiement de salaire</td></tr>}
              {filteredSalaries.map(s=>{
                const name=employees.find(e=>e.id===s.employee_id)?.name||s.employee_name||"";
                return(
                  <tr key={s.id} style={{borderBottom:"1px solid var(--border)"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"11px 16px",fontWeight:600,color:"var(--text)"}}>{name}</td>
                    <td style={{padding:"11px 16px",color:"#4ade80",fontWeight:700}}>{s.amount} DT</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:12}}>{s.month}</td>
                    <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:12}}>{dayjs(s.created_at).format("DD/MM/YYYY HH:mm")}</td>
                    <td style={{padding:"11px 16px"}}>
                      <button onClick={()=>deleteSalaryPayment(s.id,name)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sales history */}
      {activeTab==="sales"&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <ShoppingCart size={15} color="#60a5fa"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Historique des ventes</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{filteredSales.length} vente(s)</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"var(--card2)"}}>
              {["PRODUIT","QUANTITE","PRIX UNITAIRE","TOTAL","DATE",""].map(h=><th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredSales.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:30,color:"var(--muted)"}}>Aucune vente</td></tr>}
              {filteredSales.map(s=>(
                <tr key={s.id} style={{borderBottom:"1px solid var(--border)"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 16px",fontWeight:600,color:"var(--text)"}}>{s.product_name||"Article"}</td>
                  <td style={{padding:"11px 16px",color:"var(--muted)"}}>{s.quantity}</td>
                  <td style={{padding:"11px 16px",color:"var(--muted)"}}>{s.unit_price} DT</td>
                  <td style={{padding:"11px 16px",color:"#4ade80",fontWeight:700}}>{s.total} DT</td>
                  <td style={{padding:"11px 16px",color:"var(--muted)",fontSize:12}}>{dayjs(s.created_at).format("DD/MM/YYYY HH:mm")}</td>
                  <td style={{padding:"11px 16px"}}>
                    <button onClick={()=>deleteSale(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}