import React,{useState,useRef,useEffect} from "react";
import toast from "react-hot-toast";
import api from "../api";
import * as XLSX from "xlsx";
import {KeyRound,User,Download,Upload,CheckCircle,StickyNote,Trash2,FileText,BarChart2,AlertTriangle,Lock} from "lucide-react";
import {PasswordModal} from "../components/PasswordModal";

export default function Settings(){
  const[unlocked,setUnlocked]=useState(false);
  const[pwd,setPwd]=useState("");
  const[unlocking,setUnlocking]=useState(false);
  const admin=JSON.parse(localStorage.getItem("kg_admin")||"{}");
  const[form,setForm]=useState({oldPassword:"",newPassword:"",confirmPassword:""});
  const[loading,setLoading]=useState(false);
  const[importing,setImporting]=useState(false);
  const[importResult,setImportResult]=useState(null);
  const[notes,setNotes]=useState([]);
  const[newNote,setNewNote]=useState("");
  const[resetTargets,setResetTargets]=useState([]);
  const[resetting,setResetting]=useState(false);
  const[pwdModal,setPwdModal]=useState(null);
  const fileRef=useRef();

  useEffect(()=>{const saved=JSON.parse(localStorage.getItem("kg_notes")||"[]");setNotes(saved);},[]);

  async function unlock(e){
    e.preventDefault();setUnlocking(true);
    try{
      await api.post("/auth/verify-password",{password:pwd});
      setUnlocked(true);toast.success("Acces autorise!");
    }catch{toast.error("Mot de passe incorrect!");}
    finally{setUnlocking(false);}
  }

  function saveNote(){
    if(!newNote.trim())return;
    const updated=[{id:Date.now(),text:newNote.trim(),date:new Date().toLocaleDateString("fr-TN")},...notes];
    setNotes(updated);localStorage.setItem("kg_notes",JSON.stringify(updated));setNewNote("");toast.success("Note enregistree!");
  }
  function deleteNote(id){const updated=notes.filter(n=>n.id!==id);setNotes(updated);localStorage.setItem("kg_notes",JSON.stringify(updated));}

  async function handleChangePassword(e){
    e.preventDefault();
    if(form.newPassword!==form.confirmPassword)return toast.error("Les mots de passe ne correspondent pas");
    if(form.newPassword.length<4)return toast.error("Minimum 4 caracteres");
    setLoading(true);
    try{await api.post("/auth/change-password",{oldPassword:form.oldPassword,newPassword:form.newPassword});toast.success("Mot de passe modifie!");setForm({oldPassword:"",newPassword:"",confirmPassword:""});}
    catch(err){toast.error(err.response?.data?.error||"Echec");}
    finally{setLoading(false);}
  }

  async function handleExport(){
    try{
      toast.loading("Preparation...",{id:"exp"});
      const token=localStorage.getItem("kg_token");
      const res=await fetch("/api/data/export",{headers:{Authorization:"Bearer "+token}});
      if(!res.ok)throw new Error("Echec");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;
      a.download="KingdomGym-Donnees-"+new Date().toISOString().slice(0,10)+".xlsx";
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast.success("Export reussi!",{id:"exp"});
    }catch(e){toast.error("Echec",{id:"exp"});}
  }

  async function handleImport(e){
    const file=e.target.files[0];if(!file)return;
    setImporting(true);setImportResult(null);
    try{
      const reader=new FileReader();
      reader.onload=async(ev)=>{
        try{const base64=ev.target.result.split(",")[1];const{data}=await api.post("/data/import",{data:base64});setImportResult(data);toast.success("Import termine!");}
        catch(err){toast.error(err.response?.data?.error||"Echec");}
        finally{setImporting(false);}
      };
      reader.readAsDataURL(file);
    }catch(e){toast.error("Echec");setImporting(false);}
    e.target.value="";
  }

  async function downloadMonthlyReport(){
    try{
      toast.loading("Generation...",{id:"report"});
      const[membersRes,paymentsRes]=await Promise.all([api.get("/members"),api.get("/payments")]);
      const now=new Date();const thisMonth=now.getMonth();const thisYear=now.getFullYear();
      const monthPayments=paymentsRes.data.filter(p=>{const d=new Date(p.created_at);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;});
      const totalRevenue=monthPayments.reduce((s,p)=>s+(p.amount_paid||0),0);
      const newMembers=membersRes.data.filter(m=>{const d=new Date(m.created_at);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;});
      const membersWithDebt=membersRes.data.filter(m=>(m.balance||0)<0);
      const totalDebtAll=membersWithDebt.reduce((s,m)=>s+Math.abs(m.balance||0),0);
      const wb=XLSX.utils.book_new();
      const summary=[["RAPPORT MENSUEL - KINGDOM GYM",""],["Mois",thisMonth+1+"/"+thisYear],["Date",new Date().toLocaleDateString("fr-FR")],["",""],["Revenus encaisses",totalRevenue+" DT"],["Nouveaux membres",newMembers.length],["Nouveaux abonnements",monthPayments.length],["",""],["Total membres",membersRes.data.length],["Membres actifs",membersRes.data.filter(m=>m.subscription_status==="active").length],["Membres expires",membersRes.data.filter(m=>m.subscription_status==="expired").length],["Membres avec dettes",membersWithDebt.length],["Total dettes",totalDebtAll+" DT"]];
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),"Resume");
      const paymentsData=monthPayments.map(p=>({"Membre":p.full_name||"","Forfait":p.plan_name||"","Paye":p.amount_paid+" DT","Debut":p.start_date,"Fin":p.end_date}));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(paymentsData.length?paymentsData:[{"Info":"Aucun paiement"}]),"Paiements");
      XLSX.writeFile(wb,"KingdomGym-Rapport-"+thisYear+"-"+(thisMonth+1).toString().padStart(2,"0")+".xlsx");
      toast.success("Rapport genere!",{id:"report"});
    }catch(e){toast.error("Echec",{id:"report"});}
  }

  async function downloadDebtReport(){
    try{
      toast.loading("Generation...",{id:"debt"});
      const membersRes=await api.get("/members");
      const membersWithDebt=membersRes.data.filter(m=>(m.balance||0)<0);
      const wb=XLSX.utils.book_new();
      const data=membersWithDebt.map(m=>({"Membre":m.full_name||"","Tel":m.phone||"","Dette":Math.abs(m.balance||0)+" DT","Forfait":m.plan_name||"","Statut":m.subscription_status==="active"?"Actif":"Expire"}));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.length?data:[{"Info":"Aucune dette"}]),"Dettes");
      XLSX.writeFile(wb,"KingdomGym-Dettes-"+new Date().toISOString().slice(0,10)+".xlsx");
      toast.success("Rapport genere!",{id:"debt"});
    }catch(e){toast.error("Echec",{id:"debt"});}
  }

  async function downloadMembersReport(){
    try{
      toast.loading("Generation...",{id:"mem"});
      const membersRes=await api.get("/members");
      const wb=XLSX.utils.book_new();
      const data=membersRes.data.map(m=>({"Nom":m.full_name||"","Tel":m.phone||"","Forfait":m.plan_name||"","Statut":m.subscription_status==="active"?"Actif":m.subscription_status==="expired"?"Expire":"Sans forfait","Fin":m.subscription_end||"","Dette":(m.balance||0)<0?Math.abs(m.balance||0)+" DT":"","Inscrit":m.created_at?.slice(0,10)||""}));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),"Membres");
      XLSX.writeFile(wb,"KingdomGym-Membres-"+new Date().toISOString().slice(0,10)+".xlsx");
      toast.success("Rapport genere!",{id:"mem"});
    }catch(e){toast.error("Echec",{id:"mem"});}
  }

  function doReset(){
    setResetting(true);
    api.post("/reset/reset",{targets:resetTargets}).then(()=>{
      toast.success("Reinitialisation terminee!");setResetTargets([]);
    }).catch(err=>toast.error(err.response?.data?.error||"Echec"))
    .finally(()=>setResetting(false));
  }

  if(!unlocked){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:40,width:"100%",maxWidth:400,textAlign:"center",borderTop:"3px solid #E31E24"}}>
          <div style={{width:64,height:64,background:"rgba(227,30,36,0.1)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Lock size={28} color="#E31E24"/></div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Parametres</h2>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Cette page est protegee. Entrez votre mot de passe pour continuer.</p>
          <form onSubmit={unlock}>
            <input className="form-control" type="password" autoFocus value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mot de passe administrateur" style={{marginBottom:16,textAlign:"center"}}/>
            <button className="btn btn-red" type="submit" disabled={unlocking} style={{width:"100%",justifyContent:"center"}}><Lock size={14}/>{unlocking?"Verification...":"Acceder"}</button>
          </form>
        </div>
      </div>
    );
  }

  const sectionStyle={background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:24,marginBottom:20};
  const cardStyle={background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:20,textAlign:"center"};

  return(
    <div style={{maxWidth:900,margin:"0 auto",width:"100%"}}>
      {pwdModal&&<PasswordModal title={pwdModal.title} message={pwdModal.message} onConfirm={()=>{pwdModal.onConfirm();setPwdModal(null);}} onClose={()=>setPwdModal(null)}/>}
      <div className="page-header"><h1 className="page-title">Parametres</h1></div>

      <div style={sectionStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><BarChart2 size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Rapports</div><div style={{color:"var(--muted)",fontSize:13}}>Telecharger des rapports detailles en Excel</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={cardStyle}><FileText size={28} color="#f59e0b" style={{marginBottom:10}}/><div style={{fontWeight:700,marginBottom:4,color:"var(--text)"}}>Rapport Mensuel</div><div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Resume complet du mois</div><button onClick={downloadMonthlyReport} className="btn btn-sm" style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b",color:"#f59e0b",width:"100%",justifyContent:"center"}}><Download size={13}/>Telecharger</button></div>
          <div style={cardStyle}><FileText size={28} color="#E31E24" style={{marginBottom:10}}/><div style={{fontWeight:700,marginBottom:4,color:"var(--text)"}}>Rapport Dettes</div><div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Liste des membres avec dettes</div><button onClick={downloadDebtReport} className="btn btn-sm" style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",color:"#E31E24",width:"100%",justifyContent:"center"}}><Download size={13}/>Telecharger</button></div>
          <div style={cardStyle}><FileText size={28} color="#60a5fa" style={{marginBottom:10}}/><div style={{fontWeight:700,marginBottom:4,color:"var(--text)"}}>Rapport Membres</div><div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Etat complet de tous les membres</div><button onClick={downloadMembersReport} className="btn btn-sm" style={{background:"rgba(96,165,250,0.1)",border:"1px solid #60a5fa",color:"#60a5fa",width:"100%",justifyContent:"center"}}><Download size={13}/>Telecharger</button></div>
          <div style={cardStyle}><Download size={28} color="#4ade80" style={{marginBottom:10}}/><div style={{fontWeight:700,marginBottom:4,color:"var(--text)"}}>Export Complet</div><div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Toutes les donnees</div><button onClick={handleExport} className="btn btn-sm" style={{background:"rgba(74,222,128,0.1)",border:"1px solid #4ade80",color:"#4ade80",width:"100%",justifyContent:"center"}}><Download size={13}/>Telecharger</button></div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><Upload size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Importer des Donnees</div><div style={{color:"var(--muted)",fontSize:13}}>Importer un fichier Excel</div></div>
        </div>
        <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} style={{display:"none"}}/>
        <button onClick={()=>fileRef.current.click()} disabled={importing} className="btn btn-sm" style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",color:"#E31E24",justifyContent:"center"}}>
          <Upload size={14}/>{importing?"Importation...":"Choisir un fichier Excel"}
        </button>
        {importResult&&(
          <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:16,marginTop:16}}>
            <div style={{fontWeight:700,marginBottom:12,color:"#4ade80",display:"flex",alignItems:"center",gap:8}}><CheckCircle size={16}/>Import Termine</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Membres",importResult.imported.members,"#4ade80"],["Forfaits",importResult.imported.plans,"#E31E24"],["Paiements",importResult.imported.payments,"#60a5fa"]].map(([k,v,c])=>(
                <div key={k} style={{textAlign:"center",background:"var(--card)",borderRadius:8,padding:12}}>
                  <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{k} importes</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><StickyNote size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Notes Admin</div><div style={{color:"var(--muted)",fontSize:13}}>Rappels et notes importantes</div></div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <input className="form-control" value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveNote()} placeholder="Ecrire une note..." style={{flex:1}}/>
          <button onClick={saveNote} className="btn btn-red btn-sm" style={{whiteSpace:"nowrap"}}>Enregistrer</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:200,overflowY:"auto"}}>
          {notes.length===0&&<div style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:20}}>Aucune note</div>}
          {notes.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:10,background:"var(--card2)",borderRadius:8,padding:"10px 14px",border:"1px solid var(--border)"}}>
              <div style={{flex:1}}><div style={{fontSize:13,color:"var(--text)",lineHeight:1.5}}>{n.text}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{n.date}</div></div>
              <button onClick={()=>deleteNote(n.id)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:4}} onMouseOver={e=>e.currentTarget.style.color="#E31E24"} onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div style={{...sectionStyle,border:"1px solid #E31E24"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><AlertTriangle size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"#E31E24"}}>Zone de Reinitialisation</div><div style={{color:"var(--muted)",fontSize:13}}>Supprimer definitivement des donnees</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[["payments","Paiements","Supprimer tous les paiements"],["members","Membres","Supprimer tous les membres"],["plans","Forfaits","Supprimer tous les forfaits"],["activities","Activites","Supprimer toutes les activites"],["sales","Ventes","Supprimer toutes les ventes"],["salary_payments","Paiements salaires","Supprimer tous les salaires payes"],["employees","Employes","Supprimer tous les employes"],["charges","Charges","Supprimer toutes les charges"]].map(([key,label,desc])=>(
            <div key={key} onClick={()=>setResetTargets(t=>t.includes(key)?t.filter(x=>x!==key):[...t,key])}
              style={{background:resetTargets.includes(key)?"rgba(227,30,36,0.1)":"var(--card2)",border:"2px solid",borderColor:resetTargets.includes(key)?"#E31E24":"var(--border)",borderRadius:10,padding:14,cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:14,height:14,borderRadius:3,background:resetTargets.includes(key)?"#E31E24":"transparent",border:"2px solid",borderColor:resetTargets.includes(key)?"#E31E24":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {resetTargets.includes(key)&&<div style={{width:6,height:6,background:"#fff",borderRadius:1}}/>}
                </div>
                <span style={{fontWeight:700,fontSize:13,color:resetTargets.includes(key)?"#E31E24":"var(--text)"}}>{label}</span>
              </div>
              <div style={{fontSize:11,color:"var(--muted)",marginLeft:22}}>{desc}</div>
            </div>
          ))}
        </div>
        {resetTargets.length>0&&<div style={{background:"rgba(227,30,36,0.05)",border:"1px solid rgba(227,30,36,0.3)",borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:"#E31E24"}}>Attention: Action irreversible!</div>}
        <button onClick={()=>{
          if(resetTargets.length===0)return;
          setPwdModal({title:"Reinitialiser: "+resetTargets.join(", "),message:"Cette action est IRREVERSIBLE.",onConfirm:doReset});
        }} disabled={resetTargets.length===0||resetting} className="btn btn-sm"
          style={{background:resetTargets.length>0?"#E31E24":"var(--card2)",border:"1px solid",borderColor:resetTargets.length>0?"#E31E24":"var(--border)",color:resetTargets.length>0?"#fff":"var(--muted)",cursor:resetTargets.length===0?"not-allowed":"pointer"}}>
          <Trash2 size={14}/>{resetting?"En cours...":"Reinitialiser la selection"}
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><User size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Compte Administrateur</div><div style={{color:"var(--muted)",fontSize:13}}>Informations de votre compte</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Nom",admin.name],["Identifiant",admin.username],["Role","Administrateur"],["Acces","Acces complet"]].map(([k,v])=>(
            <div key={k} style={{background:"var(--card2)",borderRadius:8,padding:"12px 16px"}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:4,letterSpacing:1}}>{k.toUpperCase()}</div>
              <div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{background:"rgba(227,30,36,0.1)",padding:10,borderRadius:10}}><KeyRound size={20} color="#E31E24"/></div>
          <div><div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Changer le Mot de Passe</div><div style={{color:"var(--muted)",fontSize:13}}>Mettre a jour votre mot de passe</div></div>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group"><label>Mot de passe actuel</label><input className="form-control" type="password" required value={form.oldPassword} onChange={e=>setForm(f=>({...f,oldPassword:e.target.value}))} placeholder="........"/></div>
          <div className="form-group"><label>Nouveau mot de passe</label><input className="form-control" type="password" required value={form.newPassword} onChange={e=>setForm(f=>({...f,newPassword:e.target.value}))} placeholder="........"/></div>
          <div className="form-group"><label>Confirmer</label><input className="form-control" type="password" required value={form.confirmPassword} onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))} placeholder="........"/></div>
          <button className="btn btn-red" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center"}}>{loading?"Enregistrement...":"Changer le Mot de Passe"}</button>
        </form>
      </div>

      <div style={{textAlign:"center",padding:"20px 0",color:"var(--muted)",fontSize:12}}>
        Created & Powered by <span style={{color:"#E31E24",fontWeight:600}}>Firas Hakima</span>
      </div>
    </div>
  );
}