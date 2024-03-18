const express=require('express');
const mongoose =require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/social");
const schema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        minLength:6
    }
});

const blogSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    user:{
        type:String,
        required:true
    }
});
const Media= mongoose.model('media',schema);
const Blog=mongoose.model('blog',blogSchema);
const app=express();
app.use(express.json())

app.get("/user",async(req,resp)=>{
  
    let user=await Media.find();
    if(!user)
    {
        return resp.status(404).json({message:"No user found"});
    }
    return resp.status(200).json({user});
});

app.post("/signUp",async(req,resp)=>{
    
    let existingUser;
        existingUser =await Media.find({email})
    if(existingUser)
    {
        return resp.status(400).json({message:"User already exists! Login instead"});
    }  
})

app.post("/login",async(req,resp)=>{
    let data=new Media(req.body);
    let result=await data.save();
    resp.send(data);
   })

app.get("/blog",async(req,resp)=>{

    let blogs;
    blogs =await Blog.find();
    if(!blogs)
    {
        return resp.status(404).json({message:"No blogs found"});
    }
    return resp.status(200).json({blogs});
})

app.post("/addBlog",async(req,resp)=>{
    const{title,description,image,user}=req.body;
    const blog=new Blog({
        title,
        description,
        image,
        user
    });
    let data=new Blog(req.body);
    let result=await data.save();
    resp.send(data);
})

app.put("/update/:_id",async(req,resp)=>{
    let data=await Blog.updateOne(
        req.params,
        {
            $set:req.body
        }
    )
});

app.get("/blogbyId/:_id",async(req,resp)=>{

    let blogs;
    blogs =await Blog.findById(req.params);
    if(!blogs)
    {
        return resp.status(404).json({message:"No blogs found"});
    }
    return resp.status(200).json({blogs});
})
app.delete("/deleteBlog/:_id",async(req,resp)=>{
    let data=await Blog.findByIdAndDelete(req.params);
    resp.send(data);
})
app.listen(4200);







