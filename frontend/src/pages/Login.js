import React,{useState} from "react";
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";

export default function Login(){
  const navigate=useNavigate();
  const[form,setForm]=useState({username:"",password:""});
  const[loading,setLoading]=useState(false);
  const[showPass,setShowPass]=useState(false);

  async function handleSubmit(e){
    e.preventDefault();setLoading(true);
    try{
      const{data}=await api.post("/auth/login",form);
      localStorage.setItem("kg_token",data.token);
      localStorage.setItem("kg_admin",JSON.stringify(data.admin));
      navigate("/");
    }catch(err){toast.error(err.response?.data?.error||"Identifiants incorrects");}
    finally{setLoading(false);}
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",background:"#080808",overflow:"hidden",position:"relative"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,position:"relative",zIndex:1}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 50%, rgba(227,30,36,0.07) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",marginBottom:36}}>
          <div style={{width:240,height:240,borderRadius:40,background:"linear-gradient(135deg,#1a1a1a,#0d0d0d)",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 100px rgba(227,30,36,0.2), 0 20px 60px rgba(0,0,0,0.6)"}}>
            <img src="/BureauIcon.png" alt="Kingdom Gym" style={{width:200,height:200,objectFit:"contain",filter:"drop-shadow(0 0 30px rgba(227,30,36,0.4))"}}/>
          </div>
          <div style={{position:"absolute",inset:-1,borderRadius:40,background:"linear-gradient(135deg,rgba(227,30,36,0.25),transparent,rgba(227,30,36,0.1))",pointerEvents:"none"}}/>
        </div>
        <h1 style={{fontSize:44,fontWeight:900,color:"#fff",letterSpacing:5,textAlign:"center",lineHeight:1.1,marginBottom:12}}>KINGDOM<br/><span style={{color:"#E31E24"}}>GYM</span></h1>
        <div style={{width:50,height:3,background:"linear-gradient(to right,#E31E24,#ff4444)",margin:"0 auto 16px",borderRadius:2}}/>
        <p style={{color:"#444",fontSize:12,letterSpacing:3,textAlign:"center",fontWeight:600}}>SYSTEME DE GESTION</p>
        <div style={{marginTop:50,display:"flex",flexDirection:"column",gap:14}}>
          {[["Membres","Gerer les abonnements"],["Paiements","Suivre les revenus"],["Tableau de bord","Statistiques en temps reel"]].map(([t,d])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#E31E24",flexShrink:0}}/>
              <div><div style={{color:"#ccc",fontWeight:600,fontSize:13}}>{t}</div><div style={{color:"#3a3a3a",fontSize:12}}>{d}</div></div>
            </div>
          ))}
        </div>
        <div style={{position:"absolute",bottom:24,fontSize:11,color:"#2a2a2a",textAlign:"center"}}>
          Created & Powered by <span style={{color:"#E31E24",fontWeight:600}}>Firas Hakima</span>
        </div>
      </div>
      <div style={{width:1,background:"linear-gradient(to bottom,transparent,#1f1f1f 30%,#1f1f1f 70%,transparent)",margin:"40px 0"}}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:60,position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 50%, rgba(227,30,36,0.04) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
          <div style={{marginBottom:40}}>
            <h2 style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:8}}>Bon retour</h2>
            <p style={{color:"#444",fontSize:14}}>Connectez-vous pour gerer votre salle</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:11,color:"#555",marginBottom:8,fontWeight:700,letterSpacing:1.5}}>NOM D UTILISATEUR</label>
              <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="Entrer le nom d utilisateur" autoFocus
                style={{width:"100%",padding:"14px 16px",background:"#0f0f0f",border:"1px solid #1f1f1f",borderRadius:10,color:"#fff",fontSize:14,outline:"none",transition:"all 0.2s",boxSizing:"border-box"}}
                onFocus={e=>{e.target.style.borderColor="#E31E24";e.target.style.boxShadow="0 0 0 3px rgba(227,30,36,0.08)";}}
                onBlur={e=>{e.target.style.borderColor="#1f1f1f";e.target.style.boxShadow="none";}}/>
            </div>
            <div style={{marginBottom:32,position:"relative"}}>
              <label style={{display:"block",fontSize:11,color:"#555",marginBottom:8,fontWeight:700,letterSpacing:1.5}}>MOT DE PASSE</label>
              <input type={showPass?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Entrer le mot de passe"
                style={{width:"100%",padding:"14px 48px 14px 16px",background:"#0f0f0f",border:"1px solid #1f1f1f",borderRadius:10,color:"#fff",fontSize:14,outline:"none",transition:"all 0.2s",boxSizing:"border-box"}}
                onFocus={e=>{e.target.style.borderColor="#E31E24";e.target.style.boxShadow="0 0 0 3px rgba(227,30,36,0.08)";}}
                onBlur={e=>{e.target.style.borderColor="#1f1f1f";e.target.style.boxShadow="none";}}/>
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:14,top:38,background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:1}}>
                {showPass?"CACHER":"VOIR"}
              </button>
            </div>
            <button type="submit" disabled={loading}
              style={{width:"100%",padding:"15px",background:loading?"#1a1a1a":"linear-gradient(135deg,#E31E24,#c41a20)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:2,transition:"all 0.2s",boxShadow:loading?"none":"0 4px 30px rgba(227,30,36,0.25)"}}>
              {loading?"CONNEXION...":"SE CONNECTER"}
            </button>
          </form>
          <p style={{marginTop:24,fontSize:11,color:"#2a2a2a",textAlign:"center"}}></p>
        </div>
      </div>
    </div>
  );
}