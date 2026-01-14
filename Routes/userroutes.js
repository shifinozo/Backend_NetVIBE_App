import express from "express"
import { loginUser, registerUser } from "../controllers/usercontroller.js"



export const router = express.Router()

router.post("/registerUser",registerUser)

router.post("/loginUser",loginUser)

