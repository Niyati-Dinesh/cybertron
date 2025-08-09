const uri=process.env.MONGO_URI;
const mongoose=require('mongoose');
const connection= async()=>{
    await mongoose.connect(uri);
    console.log("Connected to mongodb");
}
module.exports=connection;