import React,{useEffect,useState} from "react";
import {Plus,Trash2,Edit2,Check,X,User,DollarSign,Calendar,CheckCircle,Lock} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import {PasswordModal} from "../components/PasswordModal";

const ROLES=["Coach","Entraineur","Receptionniste","Gestionnaire","Agent de nettoyage","Autre"];

export default function Salaires(){
  const[employees,setEmployees]=useState([]);
  const[salaryPayments,setSalaryPayments]=useState([]);
  const[month,setMonth]=useState(dayjs().format("YYYY-MM"));
  const[showAdd,setShowAdd]=useState(false);
  const[editingEmp,setEditingEmp]=useState(null);
  const[pwdModal,setPwdModal]=useState(null);
  const[form,setForm]=useState({name:"",role:"Coach",domain:"",salary:"",phone:"",notes:""});
  const[editForm,setEditForm]=useState({});
  const[payModal,setPayModal]=useState(null);
  const[payAmount,setPayAmount]=useState("");

  const[unlocked,setUnlocked]=useState(false);
  const[pwd,setPwd]=useState("");
  const[loading,setLoading]=useState(false);

  async function load(){
    try{
      const[eRes,sRes]=await Promise.all([api.get("/employees"),api.get("/salary-payments?month="+month)]);
      setEmployees(eRes.data);setSalaryPayments(sRes.data);
    }catch(e){toast.error("Erreur");}
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

  useEffect(()=>{if(unlocked)load();},[unlocked,month]);

  function isPaid(empId){return salaryPayments.some(s=>s.employee_id===empId);}
  function getPaidAmount(empId){return salaryPayments.find(s=>s.employee_id===empId)?.amount||0;}

  async function addEmployee(e){
    e.preventDefault();
    try{await api.post("/employees",form);toast.success("Employe ajoute!");setShowAdd(false);setForm({name:"",role:"Coach",domain:"",salary:"",phone:"",notes:""});load();}
    catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  async function saveEdit(id){
    try{await api.put("/employees/"+id,editForm);toast.success("Modifie!");setEditingEmp(null);load();}
    catch(err){toast.error("Echec");}
  }

  function deleteEmployee(id,name){
    setPwdModal({title:"Supprimer: "+name,message:"L employe et tous ses paiements seront supprimes.",onConfirm:async()=>{
      try{await api.delete("/employees/"+id);toast.success("Supprime!");load();}
      catch(e){toast.error(e.response?.data?.error||"Echec");}
    }});
  }

  async function paySalary(){
    if(!payAmount||+payAmount<=0)return toast.error("Montant invalide");
    try{
      await api.post("/salary-payments",{employee_id:payModal.id,amount:+payAmount,month,notes:"Salaire "+month});
      toast.success("Salaire paye! Charge ajoutee dans Comptabilite.");
      setPayModal(null);setPayAmount("");load();
    }catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  function deleteSalaryPayment(id,name){
    setPwdModal({title:"Annuler paiement de "+name,message:"Le paiement et la charge correspondante seront supprimes.",onConfirm:async()=>{
      try{await api.delete("/salary-payments/"+id);toast.success("Paiement annule!");load();}
      catch(e){toast.error("Echec");}
    }});
  }

  const totalSalaries=employees.filter(e=>e.is_active).reduce((s,e)=>s+e.salary,0);
  const totalPaid=salaryPayments.reduce((s,p)=>s+p.amount,0);
  const totalRemaining=totalSalaries-totalPaid;
  const paidCount=employees.filter(e=>isPaid(e.id)).length;

  const inp={width:"100%",background:"var(--input)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",padding:"10px 14px",fontSize:14,boxSizing:"border-box",outline:"none"};

  if(!unlocked){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:40,width:"100%",maxWidth:400,textAlign:"center",borderTop:"3px solid #E31E24"}}>
          <div style={{width:64,height:64,background:"rgba(227,30,36,0.1)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Lock size={28} color="#E31E24"/></div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Salaires</h2>
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
        <div>
          <h1 className="page-title">Salaires</h1>
          <p style={{fontSize:13,color:"var(--muted)",marginTop:4}}>{employees.filter(e=>e.is_active).length} employe(s) actif(s)</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)}
            style={{...inp,width:"auto",padding:"8px 12px"}}/>
          <button className="btn btn-red" onClick={()=>setShowAdd(true)}><Plus size={16}/>Nouvel Employe</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Total salaires",value:totalSalaries+" DT",color:"#60a5fa",icon:DollarSign},
          {label:"Payes ce mois",value:totalPaid+" DT",color:"#4ade80",icon:CheckCircle},
          {label:"Reste a payer",value:totalRemaining+" DT",color:totalRemaining>0?"#E31E24":"#4ade80",icon:DollarSign},
          {label:"Avancement",value:paidCount+"/"+employees.filter(e=>e.is_active).length,color:"#f59e0b",icon:User},
        ].map(({label,value,color,icon:Icon})=>(
          <div key={label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:20,borderTop:"2px solid "+color}}>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,fontWeight:500}}>{label}</div>
            <div style={{fontSize:24,fontWeight:900,color}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {employees.filter(e=>e.is_active).length>0&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontWeight:600,color:"var(--text)"}}>Progression des paiements - {dayjs(month).format("MMMM YYYY")}</span>
            <span style={{fontSize:13,color:"var(--muted)"}}>{paidCount}/{employees.filter(e=>e.is_active).length} employes payes</span>
          </div>
          <div style={{height:8,background:"var(--card2)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:(employees.filter(e=>e.is_active).length>0?paidCount/employees.filter(e=>e.is_active).length*100:0)+"%",background:"linear-gradient(to right,#4ade80,#22c55e)",borderRadius:4,transition:"width 0.5s"}}/>
          </div>
        </div>
      )}

      {/* Employees list */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
          <User size={15} color="#E31E24"/>
          <span style={{fontWeight:700,color:"var(--text)"}}>Employes</span>
          <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{employees.length} au total</span>
        </div>
        {employees.length===0&&(
          <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>
            <User size={32} style={{marginBottom:12,opacity:0.3}}/>
            <div style={{fontSize:14}}>Aucun employe. Cliquez sur "Nouvel Employe" pour commencer.</div>
          </div>
        )}
        {employees.map(emp=>{
          const paid=isPaid(emp.id);
          const paidAmt=getPaidAmount(emp.id);
          const sp=salaryPayments.find(s=>s.employee_id===emp.id);
          return(
            <div key={emp.id} style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:16,transition:"background 0.1s"}}
              onMouseOver={e=>e.currentTarget.style.background="var(--hover)"}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>

              {/* Avatar */}
              <div style={{width:44,height:44,borderRadius:12,background:paid?"rgba(74,222,128,0.1)":"rgba(227,30,36,0.08)",border:"1px solid",borderColor:paid?"rgba(74,222,128,0.3)":"rgba(227,30,36,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <User size={20} color={paid?"#4ade80":"#E31E24"}/>
              </div>

              {/* Info */}
              {editingEmp===emp.id?(
                <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap",alignItems:"center"}}>
                  <input style={{...inp,width:140}} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Nom"/>
                  <select style={{...inp,width:160}} value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <input style={{...inp,width:130}} value={editForm.domain} onChange={e=>setEditForm(f=>({...f,domain:e.target.value}))} placeholder="Domaine"/>
                  <input style={{...inp,width:110}} type="number" value={editForm.salary} onChange={e=>setEditForm(f=>({...f,salary:e.target.value}))} placeholder="Salaire" onFocus={e=>e.target.select()}/>
                  <input style={{...inp,width:110}} value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))} placeholder="Tel"/>
                  <button onClick={()=>saveEdit(emp.id)} style={{background:"#E31E24",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:5}}><Check size={14}/>OK</button>
                  <button onClick={()=>setEditingEmp(null)} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 10px",color:"var(--text)",cursor:"pointer",fontSize:13}}><X size={14}/></button>
                </div>
              ):(
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>{emp.name}</span>
                    <span style={{fontSize:11,background:"rgba(96,165,250,0.1)",color:"#60a5fa",border:"1px solid rgba(96,165,250,0.2)",borderRadius:6,padding:"2px 8px",fontWeight:600}}>{emp.role}</span>
                    {emp.domain&&<span style={{fontSize:11,color:"var(--muted)",background:"var(--card2)",borderRadius:6,padding:"2px 8px"}}>{emp.domain}</span>}
                  </div>
                  <div style={{display:"flex",gap:16,marginTop:4}}>
                    <span style={{fontSize:13,color:"var(--muted)"}}>Salaire: <strong style={{color:"var(--text)"}}>{emp.salary} DT</strong></span>
                    {emp.phone&&<span style={{fontSize:13,color:"var(--muted)"}}>{emp.phone}</span>}
                  </div>
                </div>
              )}

              {/* Payment status + actions */}
              {editingEmp!==emp.id&&(
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  {paid?(
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:"rgba(74,222,128,0.1)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)",borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                        <CheckCircle size={14}/>Paye {paidAmt} DT
                      </span>
                      <button onClick={()=>deleteSalaryPayment(sp.id,emp.name)} style={{background:"rgba(227,30,36,0.08)",border:"1px solid rgba(227,30,36,0.2)",borderRadius:8,padding:"6px 9px",cursor:"pointer",color:"#E31E24",display:"flex",alignItems:"center"}} title="Annuler paiement"><X size={14}/></button>
                    </div>
                  ):(
                    <button onClick={()=>{setPayModal(emp);setPayAmount(String(emp.salary));}}
                      style={{background:"#E31E24",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(227,30,36,0.3)"}}>
                      <DollarSign size={14}/>Payer salaire
                    </button>
                  )}
                  <button onClick={()=>{setEditingEmp(emp.id);setEditForm({name:emp.name,role:emp.role,domain:emp.domain||"",salary:String(emp.salary),phone:emp.phone||""});}}
                    style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 10px",cursor:"pointer",color:"var(--text)",display:"flex"}}><Edit2 size={14}/></button>
                  <button onClick={()=>deleteEmployee(emp.id,emp.name)}
                    style={{background:"rgba(227,30,36,0.08)",border:"1px solid rgba(227,30,36,0.2)",borderRadius:8,padding:"8px 10px",cursor:"pointer",color:"#E31E24",display:"flex"}}><Trash2 size={14}/></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add employee modal */}
      {showAdd&&(
        <div className="modal-overlay">
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nouvel Employe</div>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowAdd(false)}>X</button>
            </div>
            <form onSubmit={addEmployee}>
              <div className="form-group"><label>Nom complet *</label><input className="form-control" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ex: Mohamed Ben Ali"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="form-group">
                  <label>Role *</label>
                  <select className="form-control" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Domaine / Activite</label><input className="form-control" value={form.domain} onChange={e=>setForm(f=>({...f,domain:e.target.value}))} placeholder="ex: Gym, Box, Karate..."/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="form-group"><label>Salaire mensuel (DT) *</label><input className="form-control" type="number" required value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} onFocus={e=>e.target.select()} placeholder="0"/></div>
                <div className="form-group"><label>Telephone</label><input className="form-control" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="optionnel"/></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optionnel" style={{resize:"vertical"}}/></div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}>Ajouter l Employe</button>
            </form>
          </div>
        </div>
      )}

      {/* Pay salary modal */}
      {payModal&&(
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Payer salaire</div>
              <button className="btn btn-outline btn-sm" onClick={()=>setPayModal(null)}>X</button>
            </div>
            <div style={{background:"var(--card2)",borderRadius:10,padding:16,marginBottom:20}}>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:4}}>{payModal.role} — {payModal.domain||"—"}</div>
              <div style={{fontSize:20,fontWeight:800,color:"var(--text)"}}>{payModal.name}</div>
              <div style={{fontSize:13,color:"var(--muted)",marginTop:4}}>Salaire de base: <strong style={{color:"#E31E24"}}>{payModal.salary} DT</strong></div>
            </div>
            <div style={{background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#4ade80"}}>
              Ce paiement sera automatiquement ajoute comme charge dans Comptabilite.
            </div>
            <div className="form-group">
              <label>Montant a payer (DT)</label>
              <input className="form-control" type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} onFocus={e=>e.target.select()}/>
            </div>
            <div className="form-group">
              <label>Mois</label>
              <input className="form-control" value={dayjs(month).format("MMMM YYYY")} disabled style={{opacity:0.6}}/>
            </div>
            <button onClick={paySalary} className="btn btn-red" style={{width:"100%",justifyContent:"center"}}><DollarSign size={16}/>Confirmer le paiement</button>
          </div>
        </div>
      )}
    </div>
  );
}