import React,{useEffect,useState} from "react";
import {Plus,Trash2,Edit2,Check,X,Dumbbell,Sword,Target,Waves,Bike,Flower,Zap,Heart,Shield,Star,ChevronDown,ChevronUp} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import {PasswordModal} from "../components/PasswordModal";

const ICONS=[
  {key:"dumbbell",label:"Gym",Icon:Dumbbell},
  {key:"sword",label:"Karate",Icon:Sword},
  {key:"target",label:"Box",Icon:Target},
  {key:"waves",label:"Natation",Icon:Waves},
  {key:"bike",label:"Velo",Icon:Bike},
  {key:"flower",label:"Yoga",Icon:Flower},
  {key:"zap",label:"Cardio",Icon:Zap},
  {key:"heart",label:"Fitness",Icon:Heart},
  {key:"shield",label:"Arts martiaux",Icon:Shield},
  {key:"star",label:"Autre",Icon:Star},
];
const ICON_MAP=Object.fromEntries(ICONS.map(i=>[i.key,i.Icon]));
function getIcon(key,size=20,color="#fff"){const Icon=ICON_MAP[key]||Dumbbell;return <Icon size={size} color={color}/>;}

const COLORS=[
  {v:"#3b82f6",n:"Bleu"},{v:"#E31E24",n:"Rouge"},{v:"#f59e0b",n:"Orange"},
  {v:"#10b981",n:"Vert"},{v:"#8b5cf6",n:"Violet"},{v:"#ec4899",n:"Rose"},
  {v:"#06b6d4",n:"Cyan"},{v:"#f97316",n:"Corail"},
];

export default function Plans(){
  const[activities,setActivities]=useState([]);
  const[plans,setPlans]=useState([]);
  const[showAddActivity,setShowAddActivity]=useState(false);
  const[showAddPlan,setShowAddPlan]=useState(null);
  const[editingActivity,setEditingActivity]=useState(null);
  const[editingPlan,setEditingPlan]=useState(null);
  const[collapsed,setCollapsed]=useState({});
  const[actForm,setActForm]=useState({name:"",color:"#3b82f6",icon:"dumbbell"});
  const[planForm,setPlanForm]=useState({duration:"30",price:""});
  const[editActForm,setEditActForm]=useState({});
  const[editPlanForm,setEditPlanForm]=useState({});
  const[pwdModal,setPwdModal]=useState(null);

  async function load(){
    const[a,p]=await Promise.all([api.get("/activities"),api.get("/plans")]);
    setActivities(a.data);setPlans(p.data);
  }
  useEffect(()=>{load();},[]);

  const getPlans=id=>plans.filter(p=>p.activity_id===id);
  const toggleCollapse=id=>setCollapsed(c=>({...c,[id]:!c[id]}));

  async function addActivity(e){
    e.preventDefault();
    try{await api.post("/activities",actForm);toast.success("Activite ajoutee!");setShowAddActivity(false);setActForm({name:"",color:"#3b82f6",icon:"dumbbell"});load();}
    catch(err){toast.error(err.response?.data?.error||"Echec");}
  }
  function deleteActivity(id,name){setPwdModal({title:"Supprimer: "+name,message:"Tous les forfaits associes seront supprimes.",onConfirm:async()=>{try{await api.delete("/activities/"+id);toast.success("Supprime!");load();}catch(e){toast.error(e.response?.data?.error||"Echec");}}});}
  async function saveEditActivity(id){try{await api.put("/activities/"+id,editActForm);toast.success("Modifie!");setEditingActivity(null);load();}catch{toast.error("Echec");}}
  async function addPlan(e,actId){e.preventDefault();try{const a=activities.find(x=>x.id===actId);await api.post("/plans",{name:a?.name+" - "+planForm.duration+"j",duration:+planForm.duration,price:+planForm.price,activity_id:actId});toast.success("Forfait ajoute!");setShowAddPlan(null);setPlanForm({duration:"30",price:""});load();}catch(err){toast.error(err.response?.data?.error||"Echec");}}
  async function saveEditPlan(id){try{await api.put("/plans/"+id,{...editPlanForm,duration:+editPlanForm.duration,price:+editPlanForm.price});toast.success("Modifie!");setEditingPlan(null);load();}catch{toast.error("Echec");}}
  function deletePlan(id,name){setPwdModal({title:"Supprimer: "+name,message:"",onConfirm:async()=>{try{await api.delete("/plans/"+id);toast.success("Supprime!");load();}catch(e){toast.error(e.response?.data?.error||"Echec");}}});}

  const inp={width:"100%",background:"var(--input)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",padding:"10px 14px",fontSize:14,boxSizing:"border-box",outline:"none"};

  return(
    <div>
      {pwdModal&&<PasswordModal title={pwdModal.title} message={pwdModal.message} onConfirm={()=>{pwdModal.onConfirm();setPwdModal(null);}} onClose={()=>setPwdModal(null)}/>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Activites & Forfaits</h1>
          <p style={{fontSize:13,color:"var(--muted)",marginTop:4}}>{activities.length} activite(s) — {plans.length} forfait(s)</p>
        </div>
        <button className="btn btn-red" onClick={()=>setShowAddActivity(true)}><Plus size={16}/>Nouvelle Activite</button>
      </div>

      {activities.length===0&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:16}}>
          <div style={{width:80,height:80,borderRadius:20,background:"rgba(227,30,36,0.08)",border:"1px solid rgba(227,30,36,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><Dumbbell size={32} color="#E31E24"/></div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:6}}>Aucune activite</div>
            <div style={{fontSize:14,color:"var(--muted)",marginBottom:20}}>Commencez par creer vos activites sportives</div>
            <button className="btn btn-red" onClick={()=>setShowAddActivity(true)}><Plus size={16}/>Creer une activite</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:16}}>
        {activities.map(act=>{
          const actPlans=getPlans(act.id);
          const isCollapsed=collapsed[act.id];
          return(
            <div key={act.id} className="card">

              {/* Activity header bar */}
              <div className="card-header" style={{borderBottom:isCollapsed?"none":undefined}}>

                {/* Icon */}
                <div className="icon-circle" style={{borderColor:act.color}}>
                  {getIcon(act.icon,26,act.color)}
                </div>

                {/* Info */}
                {editingActivity===act.id?(
                  <div style={{display:"flex",gap:8,flex:1,alignItems:"center",flexWrap:"wrap"}}>
                    <input style={{...inp,width:160}} value={editActForm.name} onChange={e=>setEditActForm(f=>({...f,name:e.target.value}))}/>
                    <div style={{display:"flex",gap:5}}>
                      {COLORS.map(c=><div key={c.v} onClick={()=>setEditActForm(f=>({...f,color:c.v}))} title={c.n} style={{width:22,height:22,borderRadius:6,background:c.v,cursor:"pointer",outline:editActForm.color===c.v?"2px solid var(--text)":"none",outlineOffset:2}}/>)}
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {ICONS.map(({key,Icon})=><div key={key} onClick={()=>setEditActForm(f=>({...f,icon:key}))} style={{width:32,height:32,borderRadius:8,background:editActForm.icon===key?editActForm.color+"22":"var(--card2)",border:"1px solid",borderColor:editActForm.icon===key?editActForm.color:"var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:editActForm.icon===key?editActForm.color:"var(--muted)",transition:"all 0.1s"}}><Icon size={15}/></div>)}
                    </div>
                    <button onClick={()=>saveEditActivity(act.id)} style={{background:"#E31E24",border:"none",borderRadius:8,padding:"8px 16px",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:5}}><Check size={14}/>Sauvegarder</button>
                    <button onClick={()=>setEditingActivity(null)} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:5}}><X size={14}/>Annuler</button>
                  </div>
                ):(
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:18,color:"var(--text)"}}>{act.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                      <span style={{fontSize:12,color:"var(--muted)"}}>{actPlans.length} forfait(s)</span>
                      {actPlans.length>0&&<span style={{fontSize:12,color:act.color,fontWeight:600}}>
                        {Math.min(...actPlans.map(p=>p.price))} - {Math.max(...actPlans.map(p=>p.price))} DT
                      </span>}
                    </div>
                  </div>
                )}

                {editingActivity!==act.id&&(
                  <div className="card-actions">
                    <button className="btn" style={{background:act.color,color:"#fff"}} onClick={()=>setShowAddPlan(showAddPlan===act.id?null:act.id)}><Plus size={15}/>Forfait</button>
                    <button className="btn btn-outline btn-sm" onClick={()=>{setEditingActivity(act.id);setEditActForm({name:act.name,color:act.color,icon:act.icon});}}><Edit2 size={15}/></button>
                    <button className="btn btn-outline btn-sm" style={{borderColor:"rgba(227,30,36,0.2)",color:"#E31E24"}} onClick={()=>deleteActivity(act.id,act.name)}><Trash2 size={15}/></button>
                    <button className="btn btn-outline btn-sm" onClick={()=>toggleCollapse(act.id)}>{isCollapsed?<ChevronDown size={15}/>:<ChevronUp size={15}/>}</button>
                  </div>
                )}
              </div>

              {/* Plans grid */}
              {!isCollapsed&&(
                <div style={{padding:"16px 24px 20px",display:"flex",flexWrap:"wrap",gap:12,alignItems:"stretch"}}>
                  {actPlans.map(p=>(
                    <div key={p.id} className="plan-card">
                      <div className="plan-card__bar" style={{background:act.color}}/>
                      {editingPlan===p.id?(
                        <div style={{minWidth:160}}>
                          <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,fontWeight:700,letterSpacing:1}}>DUREE (jours)</div>
                          <input style={{...inp,marginBottom:10}} type="number" value={editPlanForm.duration} onChange={e=>setEditPlanForm(f=>({...f,duration:e.target.value}))} onFocus={e=>e.target.select()}/>
                          <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,fontWeight:700,letterSpacing:1}}>PRIX (DT)</div>
                          <input style={{...inp,marginBottom:12}} type="number" value={editPlanForm.price} onChange={e=>setEditPlanForm(f=>({...f,price:e.target.value}))} onFocus={e=>e.target.select()}/>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>saveEditPlan(p.id)} className="btn" style={{flex:1,padding:"8px",background:"#E31E24",border:"none",borderRadius:7,color:"#fff",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Check size={12}/>OK</button>
                            <button onClick={()=>setEditingPlan(null)} className="btn btn-outline" style={{flex:1,padding:"8px",borderRadius:7,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={12}/></button>
                          </div>
                        </div>
                      ):(
                        <div>
                          <div className="plan-card__header">
                            <span className="card-pill" style={{background:act.color+"18",borderColor:act.color+"33",color:act.color}}>{p.duration} jours</span>
                            <div className="plan-card__actions">
                              <button className="btn btn-outline btn-sm" onClick={()=>{setEditingPlan(p.id);setEditPlanForm({duration:String(p.duration),price:String(p.price)});}}><Edit2 size={13}/></button>
                              <button className="btn btn-outline btn-sm" style={{borderColor:"rgba(227,30,36,0.2)",color:"#E31E24"}} onClick={()=>deletePlan(p.id,p.name)}><Trash2 size={13}/></button>
                            </div>
                          </div>
                          <div style={{fontSize:32,fontWeight:900,color:act.color,lineHeight:1}}>{p.price}</div>
                          <div className="plan-card__footer">DT par abonnement</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add plan inline */}
                  {showAddPlan===act.id&&(
                    <div className="plan-card" style={{borderStyle:"dashed",borderColor:act.color,minWidth:180}}>
                      <div style={{fontSize:11,color:act.color,marginBottom:14,fontWeight:700,letterSpacing:1}}>NOUVEAU FORFAIT</div>
                      <form onSubmit={e=>addPlan(e,act.id)}>
                        <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,fontWeight:600,letterSpacing:1}}>DUREE (jours)</div>
                        <input style={{...inp,marginBottom:10}} type="number" required value={planForm.duration} onChange={e=>setPlanForm(f=>({...f,duration:e.target.value}))} onFocus={e=>e.target.select()}/>
                        <div style={{fontSize:10,color:"var(--muted)",marginBottom:5,fontWeight:600,letterSpacing:1}}>PRIX (DT)</div>
                        <input style={{...inp,marginBottom:14}} type="number" required value={planForm.price} onChange={e=>setPlanForm(f=>({...f,price:e.target.value}))} placeholder="0" onFocus={e=>e.target.select()}/>
                        <div style={{display:"flex",gap:8}}>
                          <button type="submit" className="btn" style={{flex:1,padding:"9px",background:act.color,color:"#fff",fontWeight:700,fontSize:13}}>Ajouter</button>
                          <button type="button" className="btn btn-outline" style={{flex:1,padding:"9px",fontSize:13}} onClick={()=>setShowAddPlan(null)}>Annuler</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {actPlans.length===0&&showAddPlan!==act.id&&(
                    <div style={{display:"flex",alignItems:"center",gap:10,color:"var(--muted)",fontSize:13,padding:"8px 4px"}}>
                      Aucun forfait — cliquez sur
                      <span style={{color:act.color,fontWeight:600}}>"+ Forfait"</span>
                      pour en ajouter
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add activity modal */}
      {showAddActivity&&(
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nouvelle Activite</div>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowAddActivity(false)}>X</button>
            </div>
            <form onSubmit={addActivity}>
              <div className="form-group">
                <label>Nom de l activite *</label>
                <input className="form-control" required value={actForm.name} onChange={e=>setActForm(f=>({...f,name:e.target.value}))} placeholder="ex: Gym, Karate, Box..."/>
              </div>
              <div className="form-group">
                <label>Icone</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                  {ICONS.map(({key,label,Icon})=>(
                    <div key={key} onClick={()=>setActForm(f=>({...f,icon:key}))}
                      style={{background:actForm.icon===key?actForm.color+"18":"var(--card2)",border:"1px solid",borderColor:actForm.icon===key?actForm.color:"var(--border)",borderRadius:10,padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:5,color:actForm.icon===key?actForm.color:"var(--muted)"}}><Icon size={20}/></div>
                      <div style={{fontSize:10,color:actForm.icon===key?actForm.color:"var(--muted)",fontWeight:600}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Couleur</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {COLORS.map(c=>(
                    <div key={c.v} onClick={()=>setActForm(f=>({...f,color:c.v}))} title={c.n}
                      style={{width:36,height:36,borderRadius:10,background:c.v,cursor:"pointer",outline:actForm.color===c.v?"2px solid var(--text)":"none",outlineOffset:3,transition:"transform 0.1s"}}
                      onMouseOver={e=>e.currentTarget.style.transform="scale(1.12)"}
                      onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}/>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div style={{padding:"14px 16px",background:"var(--card2)",borderRadius:12,marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,"+actForm.color+","+actForm.color+"aa)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px "+actForm.color+"33"}}>
                  {getIcon(actForm.icon,22,"#fff")}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>{actForm.name||"Nom de l activite"}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Apercu de l activite</div>
                </div>
              </div>
              <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center",padding:"12px"}}>Creer l Activite</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}