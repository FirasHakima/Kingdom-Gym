import React,{useState,useCallback} from "react";
import toast from "react-hot-toast";
import api from "../api";

let resolveRef=null;

export function PasswordModal({onClose,onConfirm,title,message}){
  const[pwd,setPwd]=useState("");
  const[loading,setLoading]=useState(false);
  async function confirm(){
    if(!pwd)return;
    setLoading(true);
    try{
      await api.post("/auth/verify-password",{password:pwd});
      onConfirm();
      onClose();
    }catch{toast.error("Mot de passe incorrect!");}
    finally{setLoading(false);}
  }
  return(
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{color:"#E31E24"}}>Confirmation requise</div>
        </div>
        <div style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:8,padding:14,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:"#E31E24",marginBottom:4}}>{title||"Confirmer la suppression"}</div>
          {message&&<div style={{fontSize:12,color:"var(--muted)"}}>{message}</div>}
        </div>
        <div className="form-group">
          <label>Entrez votre mot de passe administrateur</label>
          <input className="form-control" type="password" autoFocus value={pwd}
            onChange={e=>setPwd(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&confirm()}
            placeholder="Mot de passe"/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={confirm} disabled={loading} className="btn btn-red" style={{flex:1,justifyContent:"center"}}>{loading?"Verification...":"Confirmer"}</button>
          <button onClick={onClose} className="btn btn-outline" style={{flex:1,justifyContent:"center"}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export function usePasswordConfirm(){
  const[modal,setModal]=useState(null);
  const confirm=useCallback((title,message)=>{
    return new Promise((resolve)=>{
      setModal({title,message,resolve});
    });
  },[]);
  const element=modal?(
    <PasswordModal
      title={modal.title}
      message={modal.message}
      onConfirm={()=>{modal.resolve(true);setModal(null);}}
      onClose={()=>{modal.resolve(false);setModal(null);}}
    />
  ):null;
  return{confirm,element};
}