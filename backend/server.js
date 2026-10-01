const express=require("express");
const cors=require("cors");
const path=require("path");
const fs=require("fs");
const app=express();

app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({extended:true,limit:"50mb"}));

const possibleBuildPaths=[
  path.join(__dirname,"../frontend/build"),
  path.join(__dirname,"frontend/build"),
  path.join(process.resourcesPath||"","app/frontend/build"),
];
let buildPath=null;
for(const p of possibleBuildPaths){if(fs.existsSync(p)){buildPath=p;break;}}
console.log("Build path found:",buildPath);
if(buildPath)app.use(express.static(buildPath));

require("./db");

app.use("/api/auth",require("./routes/auth"));
app.use("/api/members",require("./routes/members"));
app.use("/api/plans",require("./routes/plans"));
app.use("/api/payments",require("./routes/payments"));
app.use("/api/dashboard",require("./routes/dashboard"));
app.use("/api/data",require("./routes/dataio"));
app.use("/api/products",require("./routes/products"));
app.use("/api/sales",require("./routes/sales"));
app.use("/api/charges",require("./routes/charges"));
app.use("/api/employees",require("./routes/employees"));
app.use("/api/salary-payments",require("./routes/salary_payments"));
app.use("/api/reset",require("./routes/reset"));
app.use("/api/activities",require("./routes/activities"));
app.get("/api/health",(req,res)=>res.json({status:"ok"}));

if(buildPath){app.get("*",(req,res)=>res.sendFile(path.join(buildPath,"index.html")));}

const PORT=process.env.PORT||3001;
app.listen(PORT,"127.0.0.1",()=>{console.log("\n Kingdom Gym running: http://127.0.0.1:"+PORT);console.log("   Login: admin / admin123\n");});

