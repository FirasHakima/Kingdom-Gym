import React,{useEffect,useState} from "react";
import {Plus} from "lucide-react";
import api from "../api";
import dayjs from "dayjs";
import AddPaymentModal from "../components/AddPaymentModal";
import {useThemeColors} from "../ThemeContext";

export default function Payments(){
  const[payments,setPayments]=useState([]);
  const[showAdd,setShowAdd]=useState(false);
  const{card,card2,border,text,muted,hover}=useThemeColors();
  async function load(){const{data}=await api.get("/payments");setPayments(data);}
  useEffect(()=>{load();},[]);
  return(
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{color:text}}>Paiements</h1>
        <button className="btn btn-red" onClick={()=>setShowAdd(true)}><Plus size={16}/>Nouveau Paiement</button>
      </div>
      <div style={{background:card,border:"1px solid "+border,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:card2}}>
              {["MEMBRE","FORFAIT","PRIX FORFAIT","MONTANT PAYE","DETTE","DEBUT","FIN","STATUT"].map(h=>(
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:muted,letterSpacing:1,borderBottom:"1px solid "+border}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:40,color:muted}}>Aucun paiement</td></tr>}
            {payments.map(p=>{
              const expired=dayjs(p.end_date).isBefore(dayjs());
              const debt=(p.plan_price||0)-(p.amount_paid||0);
              return(
                <tr key={p.id} style={{borderBottom:"1px solid "+border}} onMouseOver={e=>e.currentTarget.style.background=hover} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"14px 16px",fontWeight:600,color:text}}>{p.full_name}</td>
                  <td style={{padding:"14px 16px",color:muted}}>{p.plan_name}</td>
                  <td style={{padding:"14px 16px",color:muted}}>{p.plan_price} DT</td>
                  <td style={{padding:"14px 16px",color:"#4ade80",fontWeight:600}}>{p.amount_paid} DT</td>
                  <td style={{padding:"14px 16px",color:debt>0?"#E31E24":muted,fontWeight:debt>0?700:400}}>{debt>0?"-"+debt+" DT":"0 DT"}</td>
                  <td style={{padding:"14px 16px",color:muted,fontSize:13}}>{dayjs(p.start_date).format("DD/MM/YYYY")}</td>
                  <td style={{padding:"14px 16px",color:expired?"#E31E24":"#4ade80",fontSize:13}}>{dayjs(p.end_date).format("DD/MM/YYYY")}</td>
                  <td style={{padding:"14px 16px"}}>{expired?<span style={{background:"rgba(227,30,36,0.1)",color:"#E31E24",border:"1px solid #E31E24",borderRadius:6,padding:"3px 10px",fontSize:12}}>Expire</span>:<span style={{background:"rgba(74,222,128,0.1)",color:"#4ade80",border:"1px solid #4ade80",borderRadius:6,padding:"3px 10px",fontSize:12}}>Actif</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAdd&&<AddPaymentModal onClose={()=>{setShowAdd(false);load();}}/>}
    </div>
  );
}