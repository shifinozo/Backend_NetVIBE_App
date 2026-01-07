import mongoose from "mongoose";


export default async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGOAtlas_URL)
        console.log("MDB atlas cntd");
        
    }catch(error){
        console.log(" DB connection errrooorr",error);
        
    }
}