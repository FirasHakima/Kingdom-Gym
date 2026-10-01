import React,{useState} from "react";
import {Outlet,NavLink,useNavigate} from "react-router-dom";
import {LayoutDashboard,Users,Dumbbell,LogOut,Settings,Minus,Maximize2,Minimize2,Sun,Moon,ShoppingCart,BookOpen,History,UserCheck} from "lucide-react";
import {useTheme,useThemeColors} from "../ThemeContext";

const nav=[
  {to:"/",label:"Tableau de bord",icon:LayoutDashboard,end:true},
  {to:"/members",label:"Membres",icon:Users},
  {to:"/plans",label:"Activites",icon:Dumbbell},
  {to:"/ventes",label:"Ventes",icon:ShoppingCart},
  {to:"/comptabilite",label:"Comptabilite",icon:BookOpen},
  {to:"/salaires",label:"Salaires",icon:UserCheck},
  {to:"/historique",label:"Historique",icon:History},
  {to:"/settings",label:"Parametres",icon:Settings},
];

export default function Layout(){
  const navigate=useNavigate();
  const[open,setOpen]=useState(true);
  const[isFullscreen,setIsFullscreen]=useState(true);
  const{dark,setDark}=useTheme();
  const{bg,card,border}=useThemeColors();
  const text=dark?"#f0f0f0":"#111";
  const muted=dark?"#999":"#666";
  const navInactive=dark?"#ccc":"#444";
  const sidebarBg=dark?"#0a0a0a":"#fff";

  function logout(){localStorage.removeItem("kg_token");localStorage.removeItem("kg_admin");navigate("/login");}
  function minimize(){if(window.electronAPI)window.electronAPI.minimizeApp();}
  function toggleFullscreen(){if(window.electronAPI){window.electronAPI.toggleFullscreen();setIsFullscreen(f=>!f);}}

  return(
    <div style={{display:"flex",height:"100vh",background:bg,overflow:"hidden"}}>
      <aside style={{width:open?256:64,background:sidebarBg,borderRight:"1px solid "+border,display:"flex",flexDirection:"column",transition:"width 0.2s ease",overflow:"hidden",flexShrink:0}}>
        
        {/* Logo - click to toggle */}
        <div onClick={()=>setOpen(o=>!o)}
          style={{height:64,display:"flex",alignItems:"center",padding:"0 16px",gap:12,borderBottom:"1px solid "+border,cursor:"pointer",flexShrink:0,minWidth:256,transition:"background 0.15s"}}
          onMouseOver={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}
          onMouseOut={e=>e.currentTarget.style.background="transparent"}>
          <img src="/BureauIcon.png" alt="logo" style={{width:36,height:36,borderRadius:8,flexShrink:0,objectFit:"contain"}}/>
          {open&&<div>
            <div style={{fontWeight:900,fontSize:14,color:text,letterSpacing:0.5}}>KINGDOM GYM</div>
            <div style={{fontSize:9,color:"#E31E24",fontWeight:700,letterSpacing:2,marginTop:1}}>GESTION</div>
          </div>}
        </div>

        {/* Navigation */}
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {nav.map(({to,label,icon:Icon,end})=>(
            <NavLink key={to} to={to} end={end} style={({isActive})=>({
              display:"flex",alignItems:"center",
              gap:12,
              padding:"12px 14px",
              borderRadius:8,
              marginBottom:2,
              textDecoration:"none",
              background:isActive?"rgba(227,30,36,0.1)":"transparent",
              color:isActive?"#E31E24":navInactive,
              fontWeight:isActive?700:400,
              fontSize:14,
              whiteSpace:"nowrap",
              borderLeft:isActive?"3px solid #E31E24":"3px solid transparent",
              transition:"all 0.15s",
            })}
            onMouseOver={e=>{if(!e.currentTarget.style.background.includes("227"))e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)";}}
            onMouseOut={e=>{if(!e.currentTarget.style.background.includes("227"))e.currentTarget.style.background="transparent";}}>
              <Icon size={18} style={{flexShrink:0}}/>
              {open&&label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{padding:"10px 8px",borderTop:"1px solid "+border}}>
          {open&&<div style={{padding:"10px 14px",marginBottom:6,background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",borderRadius:8}}>
            <div style={{color:muted,fontSize:10,letterSpacing:1,marginBottom:2}}>CONNECTE EN TANT QUE</div>
            <div style={{fontWeight:700,fontSize:13,color:text}}>Administrateur</div>
          </div>}
          <button onClick={logout}
            style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:8,width:"100%",background:"transparent",border:"none",color:navInactive,cursor:"pointer",fontSize:14,fontWeight:400,whiteSpace:"nowrap",transition:"all 0.15s"}}
            onMouseOver={e=>e.currentTarget.style.color="#E31E24"}
            onMouseOut={e=>e.currentTarget.style.color=navInactive}>
            <LogOut size={18} style={{flexShrink:0}}/>
            {open&&"Deconnexion"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <header style={{height:52,background:dark?"#0a0a0a":card,borderBottom:"1px solid "+border,display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:14,color:text,flex:1}}>Kingdom Gym Manager</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setDark(d=>!d)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:dark?"#f59e0b":muted,fontSize:12,fontWeight:600}}>
              {dark?<Sun size={14}/>:<Moon size={14}/>}{dark?"Jour":"Nuit"}
            </button>
            <button onClick={minimize}
              style={{width:28,height:28,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:muted}}
              onMouseOver={e=>{e.currentTarget.style.background="#f59e0b22";e.currentTarget.style.color="#f59e0b";}}
              onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=muted;}}>
              <Minus size={14}/>
            </button>
            <button onClick={toggleFullscreen}
              style={{width:28,height:28,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:muted}}
              onMouseOver={e=>{e.currentTarget.style.background="#4ade8022";e.currentTarget.style.color="#4ade80";}}
              onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=muted;}}>
              {isFullscreen?<Minimize2 size={14}/>:<Maximize2 size={14}/>}
            </button>
          </div>
        </header>
        <main style={{flex:1,overflow:"auto",padding:"24px",background:bg}}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}