import React from "react";
import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";
import {Toaster} from "react-hot-toast";
import {ThemeProvider} from "./ThemeContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import Plans from "./pages/Plans";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Ventes from "./pages/Ventes";
import Comptabilite from "./pages/Comptabilite";
import Historique from "./pages/Historique";
import Salaires from "./pages/Salaires";
import "./index.css";
function ProtectedRoute({children}){const token=localStorage.getItem("kg_token");return token?children:<Navigate to="/login" replace/>;}
export default function App(){
  return(
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-right"/>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
            <Route index element={<Dashboard/>}/>
            <Route path="members" element={<Members/>}/>
            <Route path="members/:id" element={<MemberDetail/>}/>
            <Route path="plans" element={<Plans/>}/>
            <Route path="payments" element={<Payments/>}/>
            <Route path="ventes" element={<Ventes/>}/>
            <Route path="salaires" element={<Salaires/>}/>
            <Route path="historique" element={<Historique/>}/>
            <Route path="comptabilite" element={<Comptabilite/>}/>
            <Route path="settings" element={<Settings/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}