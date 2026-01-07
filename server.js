import express from 'express'
import dotenv from "dotenv"
import connectDB from './config/dbconfig.js'
import cors from "cors"
import { router } from './Routes/userroutes.js'
import { proute } from './Routes/profileroute.js'
import passport from 'passport'
import "./config/passport.js";
import authRoutes from './Routes/authRoutes.js'


dotenv.config()


const app=express()
connectDB()

app.use(cors())
app.use(express.json())

app.use(passport.initialize());
app.use("/api/auth", authRoutes);


app.use('/netvibe',router ,proute)



console.log("Node.js working in VS Code");




app.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);
