const express=require('express');
const multer=require('multer');
const mongoose=require('mongoose');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const bodyParser=require('body-parser');
const jwt=require('jsonwebtoken');
const secretKey="123secret";
mongoose.connect("mongodb://127.0.0.1:27017/task2");

const profileSchema=new mongoose.Schema({
    username:{
        type:String
    },
    password:{
        type:String
    },
    profilePic:{
        type:Buffer
        
    }
});

const productSchema=new mongoose.Schema({
    productPic:[{
        type:Buffer        
    }]
});

const Profile=mongoose.model('profiles',profileSchema);
const Product=mongoose.model('products',productSchema);
const app=express();
app.use(express.json())
const uploadProfilePic=multer({
   storage:multer.diskStorage({
    destination:function(req,file,cb)
    {
        cb(null,"profile_pic")
    },
    filename:function(req,file,cb)
    {
        cb(null,Date.now()+'-'+file.originalname);
    }
   })
}).single("profilePic");

const uploadProductPic=multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb)
        {
            cb(null,"product_pic")
        },
        filename:function(req,file,cb)
        {
            cb(null,Date.now()+'-'+file.originalname);
        }
    })
}).array("productPic");

app.post("/signUp", async (req, resp) => {
    try {
        let existingUser = await Profile.findOne({ username: req.body.username });
        if (!existingUser) {
            return resp.status(401).json({ message: 'Invalid username or password' });
        }
        const passMatch = await bcrypt.compare(req.body.password, existingUser.password || '');
        if (!passMatch) {
            return resp.status(401).json({ message: "Invalid username or password" });
        }
        const token = jwt.sign({ username: req.body.username }, secretKey, { expiresIn: '1h' });
        resp.status(200).json({ token })
    }
    catch (error) {
        console.log(error);
        resp.status(400).json({ message: "Internal server error" });
    }
});

app.post("/login", async (req, resp) => {
    try {
        const existingUser = await Profile.findOne({ username: req.body.username });
        if (existingUser) {
            return resp.status(400).json({ message: 'User already exists' });
        }
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        let data = new Profile({ username: req.body.username, password: hashedPass });
        let result = await data.save();
        console.log(result);
        resp.status(201).json({ message: "User created successfully" });
    } catch (err) {
        resp.status(500).send(err.message);
    }
});


app.post('/profilepic',uploadProfilePic,async(req,resp)=>{
    try{
        const user=await Profile.findOne(req.body.username);
        user.profilePic=fs.readFileSync(req.file.path);
        let result=await user.save();
        resp.send("Profile uploaded successfully");
        console.log(result); 
    }
    catch(err)
    {
        resp.status(500).send(err.message);
    }
});

app.post('/productpic', uploadProductPic, async (req, resp) => {
    try {
        const product = new Product({
            productPic: req.files.map(file => fs.readFileSync(file.path))
        });
        let result = await product.save();
        resp.send("Product pictures uploaded successfully");
        console.log(result);
    } catch (err) {
        resp.status(500).send(err.message);
    }
});
app.use(bodyParser.json());

// Middleware to verify JWT token
function verifyToken(req,resp,next){
    const bearerHeader=req.headers['authorization'];
    if(typeof bearerHeader!='undefined')
    {
        const bearer=bearerHeader.split(" ");
        const token=bearer[1];
        req.token=token;
        next();//gives control to the api created
    }
    else
    {
        resp.send({
            result:"token is not valid"
        })
    }
}

app.get("/verify",verifyToken,(req,resp)=>{
    jwt.verify(req.token,secretKey,(err,authData)=>{
        if(err)
        {
            resp.send({result:"invalid token"});
        }
        else
        {
            resp.json({
                message:"profile accessed",
                authData
            })
        }
    })
})
app.listen(4200);
