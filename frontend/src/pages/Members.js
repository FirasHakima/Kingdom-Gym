import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {Plus,Search,Clock,AlertCircle,Dumbbell,Sword,Target,Waves,Bike,Flower,Zap,Heart,Shield,Star} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";
import AddMemberModal from "../components/AddMemberModal";
import {useTheme} from "../ThemeContext";

const ICON_MAP={dumbbell:Dumbbell,sword:Sword,target:Target,waves:Waves,bike:Bike,flower:Flower,zap:Zap,heart:Heart,shield:Shield,star:Star};

function ActivityIcon({icon,color,size=16}){
  const Icon=ICON_MAP[icon]||Dumbbell;
  return <Icon size={size} color={color||"#E31E24"}/>;
}

export default function Members(){
  const[members,setMembers]=useState([]);
  const[activities,setActivities]=useState([]);
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("all");
  const[showAdd,setShowAdd]=useState(false);
  const navigate=useNavigate();
  const{dark}=useTheme();

  async function load(){
    try{
      const[mRes,aRes]=await Promise.all([api.get("/members"),api.get("/activities")]);
      setMembers(mRes.data);setActivities(aRes.data);
    }catch{toast.error("Erreur");}
  }
  useEffect(()=>{load();},[]);

  function getActivity(planName){
    if(!planName)return null;
    return activities.find(a=>planName.toLowerCase().includes(a.name.toLowerCase()));
  }

  const filtered=members.filter(m=>{
    const matchSearch=!search||m.full_name?.toLowerCase().includes(search.toLowerCase())||m.phone?.includes(search);
    const matchFilter=filter==="all"||(filter==="active"&&m.subscription_status==="active")||(filter==="expired"&&m.subscription_status==="expired")||(filter==="debt"&&(m.balance||0)<0);
    return matchSearch&&matchFilter;
  });

  function daysLeft(endDate){if(!endDate)return null;return dayjs(endDate).diff(dayjs(),"day");}

  const stats=[
    {label:"Tous",count:members.length,color:"var(--muted)",f:"all"},
    {label:"Actifs",count:members.filter(m=>m.subscription_status==="active").length,color:"#4ade80",f:"active"},
    {label:"Expires",count:members.filter(m=>m.subscription_status==="expired").length,color:"#E31E24",f:"expired"},
    {label:"Dettes",count:members.filter(m=>(m.balance||0)<0).length,color:"#f59e0b",f:"debt"},
  ];

  return(
    <div>
      <div className="page-header">
        <h1 className="page-title">Membres</h1>
        <button className="btn btn-red" onClick={()=>setShowAdd(true)}><Plus size={16}/>Nouveau Membre</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {stats.map(s=>(
          <div key={s.f} onClick={()=>setFilter(s.f)}
            style={{background:filter===s.f?"var(--card2)":"var(--card)",border:"1px solid",borderColor:filter===s.f?s.color:"var(--border)",borderRadius:10,padding:"16px 20px",cursor:"pointer",transition:"all 0.15s",borderTop:filter===s.f?"2px solid "+s.color:"1px solid var(--border)"}}>
            <div style={{fontSize:28,fontWeight:900,color:s.color,lineHeight:1}}>{s.count}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:6,fontWeight:500}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{position:"relative",marginBottom:16}}>
        <Search size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--muted)"}}/>
        <input className="form-control" style={{paddingLeft:40}} placeholder="Rechercher par nom ou telephone..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"var(--card2)"}}>
              {["MEMBRE","TELEPHONE","ACTIVITE","FORFAIT","STATUT","JOURS RESTANTS","DETTE","INSCRIT LE"].map(h=>(
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"var(--muted)"}}>Aucun membre trouve</td></tr>}
            {filtered.map(m=>{
              const days=daysLeft(m.subscription_end);
              const hasDebt=(m.balance||0)<0;
              const isActive=m.subscription_status==="active";
              const isExpiringSoon=isActive&&days!==null&&days<=7&&days>=0;
              const act=getActivity(m.plan_name);
              return(
                <tr key={m.id} style={{cursor:"pointer",borderBottom:"1px solid var(--border)",transition:"background 0.1s"}}
                  onClick={()=>navigate("/members/"+m.id)}
                  onMouseOver={e=>e.currentTarget.style.background="var(--hover)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"14px 16px"}}>
                    <div style={{fontWeight:600,color:"var(--text)"}}>{m.full_name}</div>
                    {m.email&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.email}</div>}
                  </td>
                  <td style={{padding:"14px 16px",color:"var(--muted)"}}>{m.phone||"—"}</td>
                  <td style={{padding:"14px 16px"}}>
                    {act?(
                      <div style={{display:"flex",alignItems:"center",gap:6,background:act.color+"15",border:"1px solid "+act.color+"40",borderRadius:8,padding:"4px 10px",width:"fit-content"}}>
                        <ActivityIcon icon={act.icon} color={act.color} size={13}/>
                        <span style={{fontSize:12,fontWeight:600,color:act.color}}>{act.name}</span>
                      </div>
                    ):<span style={{color:"var(--muted)",fontSize:13}}>—</span>}
                  </td>
                  <td style={{padding:"14px 16px",color:"var(--muted)",fontSize:13}}>{m.plan_name||"—"}</td>
                  <td style={{padding:"14px 16px"}}>
                    {m.subscription_status==="active"&&<span style={{background:"rgba(74,222,128,0.12)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>Actif</span>}
                    {m.subscription_status==="expired"&&<span style={{background:"rgba(227,30,36,0.12)",color:"#E31E24",border:"1px solid rgba(227,30,36,0.3)",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>Expire</span>}
                    {m.subscription_status==="no_plan"&&<span style={{background:"var(--card2)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:6,padding:"3px 10px",fontSize:12}}>Sans forfait</span>}
                  </td>
                  <td style={{padding:"14px 16px"}}>
                    {isActive&&days!==null?(
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <Clock size={13} color={isExpiringSoon?"#f59e0b":"#4ade80"}/>
                        <span style={{fontSize:13,fontWeight:600,color:isExpiringSoon?"#f59e0b":days<=0?"#E31E24":"#4ade80"}}>
                          {days<=0?"Aujourd hui":days===1?"1 jour":days+" jours"}
                        </span>
                        {isExpiringSoon&&<span style={{fontSize:10,background:"rgba(245,158,11,0.15)",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.3)",borderRadius:4,padding:"1px 6px"}}>Bientot</span>}
                      </div>
                    ):<span style={{color:"var(--muted)",fontSize:13}}>—</span>}
                  </td>
                  <td style={{padding:"14px 16px"}}>
                    {hasDebt?(
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <AlertCircle size={13} color="#E31E24"/>
                        <span style={{fontSize:13,fontWeight:700,color:"#E31E24"}}>{Math.abs(m.balance||0)} DT</span>
                      </div>
                    ):<span style={{color:"var(--muted)",fontSize:13}}>—</span>}
                  </td>
                  <td style={{padding:"14px 16px",fontSize:12,color:"var(--muted)"}}>{dayjs(m.created_at).format("DD/MM/YYYY")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAdd&&<AddMemberModal onClose={()=>{setShowAdd(false);load();}}/>}
    </div>
  );
}