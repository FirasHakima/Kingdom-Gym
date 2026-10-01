import React,{useState,useEffect} from "react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import {Dumbbell,Sword,Target,Waves,Bike,Flower,Zap,Heart,Shield,Star} from "lucide-react";

const ICON_MAP={
  "dumbbell":Dumbbell,"sword":Sword,"target":Target,"waves":Waves,
  "bike":Bike,"flower":Flower,"zap":Zap,"heart":Heart,"shield":Shield,"star":Star
};

function ActivityIcon({icon,size=24}){
  const Icon=ICON_MAP[icon]||Dumbbell;
  return <Icon size={size}/>;
}

export default function AddMemberModal({onClose}){
  const[activities,setActivities]=useState([]);
  const[plans,setPlans]=useState([]);
  const[selectedActivity,setSelectedActivity]=useState(null);
  const[form,setForm]=useState({full_name:"",phone:"",email:"",gender:"male",birth_date:"",notes:"",plan_id:"",amount_paid:"",start_date:dayjs().format("YYYY-MM-DD"),payment_notes:""});
  const[errors,setErrors]=useState({});

  useEffect(()=>{
    Promise.all([api.get("/activities"),api.get("/plans")]).then(([actsRes,plansRes])=>{
      setActivities(actsRes.data);setPlans(plansRes.data);
    });
  },[]);

  const activityPlans=selectedActivity?plans.filter(p=>p.activity_id===selectedActivity.id):[];
  const selectedPlan=plans.find(p=>p.id===+form.plan_id);
  const endDate=selectedPlan&&form.start_date?dayjs(form.start_date).add(selectedPlan.duration,"day").format("YYYY-MM-DD"):null;
  const debt=selectedPlan&&form.amount_paid!==""?selectedPlan.price-+form.amount_paid:0;

  function selectActivity(act){setSelectedActivity(act);setForm(f=>({...f,plan_id:"",amount_paid:""}));}
  function selectPlan(id){const p=plans.find(pl=>pl.id===+id);setForm(f=>({...f,plan_id:id,amount_paid:p?.price||""}));}

  function validate(){
    const e={};
    if(!form.full_name.trim())e.full_name="Nom obligatoire";
    if(form.phone){const d=form.phone.replace(/\s/g,"");if(!/^\d+$/.test(d))e.phone="Chiffres uniquement";else if(d.length!==8)e.phone="8 chiffres obligatoires";}
    if(form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))e.email="Email invalide";
    if(!selectedActivity)e.activity="Choisir une activite";
    if(!form.plan_id)e.plan_id="Choisir un forfait";
    if(form.amount_paid===""||form.amount_paid===null)e.amount_paid="Montant obligatoire";
    else if(+form.amount_paid<0)e.amount_paid="Montant invalide";
    if(!form.start_date)e.start_date="Date obligatoire";
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function handleSubmit(e){
    e.preventDefault();
    if(!validate())return;
    try{
      const memberRes=await api.post("/members",{full_name:form.full_name,phone:form.phone,email:form.email,gender:form.gender,birth_date:form.birth_date,notes:form.notes});
      await api.post("/payments",{member_id:memberRes.data.id,plan_id:form.plan_id,amount_paid:+form.amount_paid,start_date:form.start_date,notes:form.payment_notes});
      toast.success("Membre ajoute!");onClose();
    }catch(err){toast.error(err.response?.data?.error||"Echec");}
  }

  return(
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Ajouter un Membre</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>X</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{fontSize:11,color:"#E31E24",fontWeight:700,letterSpacing:1,marginBottom:12}}>INFORMATIONS DU MEMBRE</div>
          <div className="form-group">
            <label>Nom Complet *</label>
            <input className="form-control" placeholder="ex: Mohamed Ben Ali" value={form.full_name}
              onChange={e=>{setForm(f=>({...f,full_name:e.target.value}));setErrors(er=>({...er,full_name:""}));}}
              style={{borderColor:errors.full_name?"#E31E24":""}}/>
            {errors.full_name&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.full_name}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group">
              <label>Telephone (8 chiffres)</label>
              <input className="form-control" type="tel" placeholder="55123456" maxLength={8} value={form.phone}
                onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,8);setForm(f=>({...f,phone:v}));setErrors(er=>({...er,phone:""}));}}
                style={{borderColor:errors.phone?"#E31E24":""}}/>
              {errors.phone&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.phone}</div>}
              {form.phone&&<div style={{fontSize:11,color:form.phone.length===8?"#4ade80":"var(--muted)",marginTop:4}}>{form.phone.length}/8</div>}
            </div>
            <div className="form-group">
              <label>Genre</label>
              <select className="form-control" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="optionnel" value={form.email}
                onChange={e=>{setForm(f=>({...f,email:e.target.value}));setErrors(er=>({...er,email:""}));}}
                style={{borderColor:errors.email?"#E31E24":""}}/>
              {errors.email&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input className="form-control" type="date" value={form.birth_date} onChange={e=>setForm(f=>({...f,birth_date:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} placeholder="Notes..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{resize:"vertical"}}/>
          </div>

          <div style={{borderTop:"1px solid var(--border)",margin:"16px 0"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{fontSize:11,color:"#E31E24",fontWeight:700,letterSpacing:1}}>ACTIVITE & ABONNEMENT</div>
            <span style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:4,padding:"2px 6px",fontSize:10,color:"#E31E24",fontWeight:700}}>OBLIGATOIRE</span>
          </div>

          <div className="form-group">
            <label>Choisir une activite *</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
              {activities.map(act=>{
                const Icon=ICON_MAP[act.icon]||Dumbbell;
                return(
                  <div key={act.id} onClick={()=>selectActivity(act)}
                    style={{background:selectedActivity?.id===act.id?"rgba(227,30,36,0.1)":"var(--card2)",border:"2px solid",borderColor:selectedActivity?.id===act.id?act.color:"var(--border)",borderRadius:10,padding:"12px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:6,color:selectedActivity?.id===act.id?act.color:"var(--muted)"}}>
                      <Icon size={22}/>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:selectedActivity?.id===act.id?act.color:"var(--text)"}}>{act.name}</div>
                  </div>
                );
              })}
            </div>
            {errors.activity&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.activity}</div>}
          </div>

          {selectedActivity&&(
            <>
              <div className="form-group">
                <label>Duree du forfait *</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
                  {activityPlans.map(p=>(
                    <div key={p.id} onClick={()=>selectPlan(p.id)}
                      style={{background:+form.plan_id===p.id?"rgba(227,30,36,0.1)":"var(--card2)",border:"2px solid",borderColor:+form.plan_id===p.id?"#E31E24":"var(--border)",borderRadius:10,padding:"12px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{p.duration} jours</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#E31E24",marginTop:4}}>{p.price} DT</div>
                    </div>
                  ))}
                </div>
                {activityPlans.length===0&&<div style={{fontSize:12,color:"var(--muted)",marginTop:8}}>Aucun forfait pour cette activite.</div>}
                {errors.plan_id&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.plan_id}</div>}
              </div>

              {form.plan_id&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div className="form-group">
                      <label>Date de debut *</label>
                      <input className="form-control" type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label>Date de fin (auto)</label>
                      <input className="form-control" value={endDate||"—"} disabled style={{opacity:0.5}}/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Montant paye (DT) * — Prix: {selectedPlan?.price||0} DT</label>
                    <input className="form-control" type="number" min="0" value={form.amount_paid}
                      onChange={e=>{setForm(f=>({...f,amount_paid:e.target.value}));setErrors(er=>({...er,amount_paid:""}));}}
                      onFocus={e=>e.target.select()} placeholder="Montant paye"
                      style={{borderColor:errors.amount_paid?"#E31E24":""}}/>
                    {errors.amount_paid&&<div style={{fontSize:11,color:"#E31E24",marginTop:4}}>! {errors.amount_paid}</div>}
                  </div>
                  {debt>0&&<div style={{background:"rgba(227,30,36,0.08)",border:"1px solid rgba(227,30,36,0.3)",borderRadius:8,padding:10,marginBottom:12,fontSize:13,color:"#E31E24"}}>Reste a payer: <strong>{debt} DT</strong></div>}
                  {debt===0&&form.amount_paid!==""&&<div style={{background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:8,padding:10,marginBottom:12,fontSize:13,color:"#4ade80"}}>Entierement paye</div>}
                  <div className="form-group">
                    <label>Notes de paiement</label>
                    <input className="form-control" value={form.payment_notes} onChange={e=>setForm(f=>({...f,payment_notes:e.target.value}))} placeholder="Optionnel"/>
                  </div>
                </>
              )}
            </>
          )}

          <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center",marginTop:8}}>
            Ajouter Membre + Abonnement
          </button>
        </form>
      </div>
    </div>
  );
}