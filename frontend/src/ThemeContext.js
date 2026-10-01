import React,{createContext,useContext,useState,useEffect} from "react";
const ThemeContext=createContext();
const darkTheme={"--bg":"#0A0A0A","--card":"#111111","--card2":"#1A1A1A","--border":"#2a2a2a","--text":"#ffffff","--muted":"#888888","--input":"#1a1a1a","--hover":"#1f1f1f","--sidebar":"#0D0D0D"};
const lightTheme={"--bg":"#f0f2f5","--card":"#ffffff","--card2":"#f5f5f5","--border":"#e0e0e0","--text":"#111111","--muted":"#666666","--input":"#ffffff","--hover":"#f0f0f0","--sidebar":"#ffffff"};
function getSystemTheme(){try{return window.matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){return false;}}
function applyTheme(dark){
  const theme=dark?darkTheme:lightTheme;
  Object.entries(theme).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  document.body.style.background=theme["--bg"];
  document.body.style.color=theme["--text"];
}
export function ThemeProvider({children}){
  const[dark,setDark]=useState(()=>{
    const saved=localStorage.getItem("kg_theme");
    if(saved==="dark")return true;
    if(saved==="light")return false;
    return getSystemTheme();
  });
  useEffect(()=>{
    applyTheme(dark);
    localStorage.setItem("kg_theme",dark?"dark":"light");
  },[dark]);
  useEffect(()=>{
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const handler=(e)=>{
      const manual=localStorage.getItem("kg_theme_manual");
      if(!manual)setDark(e.matches);
    };
    mq.addEventListener("change",handler);
    return()=>mq.removeEventListener("change",handler);
  },[]);
  function toggleDark(){
    localStorage.setItem("kg_theme_manual","1");
    setDark(d=>!d);
  }
  return React.createElement(ThemeContext.Provider,{value:{dark,setDark:toggleDark}},children);
}
export function useTheme(){return useContext(ThemeContext);}
export function useThemeColors(){
  const{dark}=useTheme();
  return{
    dark,
    bg:"var(--bg)",card:"var(--card)",card2:"var(--card2)",
    border:"var(--border)",text:"var(--text)",muted:"var(--muted)",
    input:"var(--input)",hover:"var(--hover)",sidebar:"var(--sidebar)",
    btnBg:dark?"#2a2a2a":"#f0f0f0",
    btnBorder:dark?"#3a3a3a":"#ddd",
  };
}