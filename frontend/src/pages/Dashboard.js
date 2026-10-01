import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {Users,TrendingUp,AlertCircle,Clock,AlertTriangle} from "lucide-react";
import api from "../api";
import dayjs from "dayjs";
import {useThemeColors} from "../ThemeContext";

export default function Dashboard(){
  const[stats,setStats]=useState(null);
  const[members,setMembers]=useState([]);
  const navigate=useNavigate();
  const t=useThemeColors();

  useEffect(()=>{
    api.get("/dashboard").then(r=>setStats(r.data)).catch(()=>{});
    api.get("/members").then(r=>setMembers(r.data)).catch(()=>{});
  },[]);

  if(!stats)return <div style={{padding:40,color:"var(--muted)",textAlign:"center"}}>Chargement...</div>;

  const activeMembers=members.filter(m=>m.subscription_status==="active").length;
  const expiredMembers=members.filter(m=>m.subscription_status==="expired").length;
  const membersWithDebt=members.filter(m=>(m.balance||0)<0).length;
  const totalDebt=members.reduce((s,m)=>(m.balance||0)<0?s+Math.abs(m.balance||0):s,0);
  const expiringIn3=members.filter(m=>{
    if(m.subscription_status!=="active")return false;
    const d=dayjs(m.subscription_end).diff(dayjs(),"day");
    return d>=0&&d<=3;
  }).length;

  const statCards=[
    {label:"Total Membres",value:members.length,icon:Users,color:"#60a5fa",sub:"inscrits"},
    {label:"Abonnements Actifs",value:activeMembers,icon:TrendingUp,color:"#4ade80",sub:"en cours"},
    {label:"Abonnements Expires",value:expiredMembers,icon:AlertCircle,color:"#E31E24",sub:"a renouveler"},
    {label:"Membres avec dettes",value:membersWithDebt,icon:AlertTriangle,color:"#f59e0b",sub:totalDebt+" DT total"},
    {label:"Expirent dans 3j",value:expiringIn3,icon:Clock,color:"#f59e0b",sub:"a contacter"},
  ];

  return(
    <div>
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <div style={{fontSize:13,color:"var(--muted)",background:"var(--card)",border:"1px solid var(--border)",padding:"8px 16px",borderRadius:8}}>{dayjs().format("dddd D MMMM YYYY")}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {statCards.map(({label,value,icon:Icon,color,sub})=>(
          <div key={label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:20,borderTop:"2px solid "+color,transition:"transform 0.15s",cursor:"default"}}
            onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,fontWeight:500}}>{label}</div>
                <div style={{fontSize:30,fontWeight:900,color:"var(--text)"}}>{value}</div>
                <div style={{fontSize:11,color:color,marginTop:4}}>{sub}</div>
              </div>
              <div style={{background:"var(--card2)",padding:12,borderRadius:10,border:"1px solid var(--border)"}}><Icon size={22} color={color}/></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <Clock size={16} color="#f59e0b"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Expirent bientot</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{stats.expiring_soon?.length||0} membre(s)</span>
          </div>
          <div style={{maxHeight:320,overflowY:"auto"}}>
            {(!stats.expiring_soon||stats.expiring_soon.length===0)&&<div style={{padding:30,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucun abonnement n expire bientot</div>}
            {stats.expiring_soon&&stats.expiring_soon.map(m=>{
              const days=dayjs(m.end_date).diff(dayjs(),"day");
              return(
                <div key={m.id} onClick={()=>navigate("/members/"+m.member_id)}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background 0.1s"}}
                  onMouseOver={e=>e.currentTarget.style.background="var(--hover)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <div><div style={{fontWeight:600,fontSize:13,color:"var(--text)"}}>{m.full_name}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.plan_name}</div></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,color:"#f59e0b",fontWeight:700}}>{days<=0?"Aujourd hui":days===1?"Demain":days+" jours"}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{dayjs(m.end_date).format("DD/MM/YYYY")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <AlertTriangle size={16} color="#E31E24"/>
            <span style={{fontWeight:700,color:"var(--text)"}}>Membres avec dettes</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>{membersWithDebt} membre(s)</span>
          </div>
          <div style={{maxHeight:320,overflowY:"auto"}}>
            {membersWithDebt===0&&<div style={{padding:30,textAlign:"center",color:"var(--muted)",fontSize:13}}>Aucune dette en cours</div>}
            {members.filter(m=>(m.balance||0)<0).map(m=>(
              <div key={m.id} onClick={()=>navigate("/members/"+m.id)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background 0.1s"}}
                onMouseOver={e=>e.currentTarget.style.background="var(--hover)"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <div><div style={{fontWeight:600,fontSize:13,color:"var(--text)"}}>{m.full_name}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.phone||""}</div></div>
                <div style={{fontSize:15,fontWeight:800,color:"#E31E24"}}>-{Math.abs(m.balance||0)} DT</div>
              </div>
            ))}
            {membersWithDebt>0&&(
              <div style={{padding:"12px 20px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"var(--muted)"}}>Total dettes</span>
                <span style={{fontSize:16,fontWeight:800,color:"#E31E24"}}>{totalDebt} DT</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}