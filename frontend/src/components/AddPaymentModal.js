import React,{useState,useEffect} from "react";
import toast from "react-hot-toast";
import api from "../api";
import dayjs from "dayjs";

export default function AddPaymentModal({memberId,memberName,onClose}){
  const[plans,setPlans]=useState([]);
  const[form,setForm]=useState({plan_id:"",amount_paid:"",start_date:dayjs().format("YYYY-MM-DD"),notes:""});
  const[selectedPlan,setSelectedPlan]=useState(null);

  useEffect(()=>{
    api.get("/plans").then(r=>{
      setPlans(r.data);
      if(r.data[0]){setForm(f=>({...f,plan_id:r.data[0].id,amount_paid:r.data[0].price}));setSelectedPlan(r.data[0]);}
    });
  },[]);

  function selectPlan(id){
    const p=plans.find(pl=>pl.id===+id);
    setSelectedPlan(p);
    setForm(f=>({...f,plan_id:id,amount_paid:p?.price||""}));
  }

  const endDate=selectedPlan&&form.start_date?dayjs(form.start_date).add(selectedPlan.duration,"day").format("YYYY-MM-DD"):null;
  const debt=selectedPlan?selectedPlan.price-+form.amount_paid:0;

  async function handleSubmit(e){
    e.preventDefault();
    try{
      await api.post("/payments",{...form,member_id:memberId});
      toast.success("Subscription added!");
      onClose();
    }catch(err){toast.error(err.response?.data?.error||"Failed");}
  }

  return(
    <div className="modal-overlay">
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Subscription Ã¢â‚¬â€ {memberName}</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Ã¢Å“â€¢</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Plan</label>
            <select className="form-control" required value={form.plan_id} onChange={e=>selectPlan(e.target.value)}>
              {plans.map(p=><option key={p.id} value={p.id}>{p.name} Ã¢â‚¬â€ {p.price} DT ({p.duration} days)</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group"><label>Start Date</label><input className="form-control" type="date" required value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/></div>
            <div className="form-group"><label>End Date (auto)</label><input className="form-control" value={endDate||"Ã¢â‚¬â€"} disabled style={{opacity:0.5}}/></div>
          </div>
          <div className="form-group">
            <label>Amount Paid (DT) Ã¢â‚¬â€ Plan price: {selectedPlan?.price||0} DT</label>
            <input className="form-control" type="number" required value={form.amount_paid} onChange={e=>setForm(f=>({...f,amount_paid:e.target.value}))} placeholder="Can be less than plan price"/>
          </div>
          {debt>0&&(
            <div style={{background:"rgba(227,30,36,0.1)",border:"1px solid #E31E24",borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:"#E31E24"}}>
              Ã¢Å¡Â Ã¯Â¸Â Member will owe <strong>{debt} DT</strong> Ã¢â‚¬â€ this will be added to their debt
            </div>
          )}
          {debt===0&&form.amount_paid&&(
            <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid #4ade80",borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:"#4ade80"}}>
              Ã¢Å“â€¦ Fully paid
            </div>
          )}
          <div className="form-group"><label>Notes</label><input className="form-control" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>
          {endDate&&<div style={{background:"rgba(227,30,36,0.05)",border:"1px solid #1f1f1f",borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:"#888"}}>Active: {dayjs(form.start_date).format("MMM D")} Ã¢â€ â€™ {dayjs(endDate).format("MMM D, YYYY")}</div>}
          <button className="btn btn-red" type="submit" style={{width:"100%",justifyContent:"center"}}>Confirm Subscription</button>
        </form>
      </div>
    </div>
  );
}