require('dotenv').config();


const connection=require("./db");
connection();

const express=require('express');
const app=express();

const cors=require('cors');

app.use(cors({
  origin: 'http://localhost:7777', // Your frontend URL, no one else gets you, only me
  credentials: true,
}));

app.get('/',(req,res)=>{
    console.log("At base path.")
})

const port=process.env.PORT || 5000
app.listen(port , ()=>{
    console.log("Backend listening at : http://localhost:"+port)
})