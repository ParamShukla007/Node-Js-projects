const mongoose=require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/gameE");
const bcrypt=require('bcryptjs');
const express=require('express');
app=express();
app.use(express.json());
const jwt=require('jsonwebtoken');
const secretKey="123secret";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        minLength:8,
        required:true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    contact_no:{
        type:Number,
        length:10
    }
})

const cartSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    cart: {
        type: [{
            gameName: String,
            gameCost: Number
        }],
    }
});

const gameSchema= new mongoose.Schema({
    gameName:{
        type:String
    },
    gameCost:{
        type:Number
    },
    quantity:{
        type:Number
    }
});
const Game=new mongoose.model('games',gameSchema);
const User=new mongoose.model('users',userSchema);
const Cart =new mongoose.model('carts',cartSchema);
app.post("/signIn",async(req,resp)=>{
    try{
        let existingUser=await User.findOne({username:req.body.username});
        if(!existingUser)
        {
            return resp.status(201).json({message:"Invalid username or password"});
        }
        const passMatch=await bcrypt.compare(req.body.password,existingUser.password||'');
        if(!passMatch)
        {
            return resp.status(201).json({ message: "Invalid username or password" });  
        }
        const token=jwt.sign({ username: req.body.username,email:req.body.email,contact_no:req.body.contact_no },secretKey,{expiresIn:'1h'});
        resp.status(201).json({token});
    }
    catch(err)
    {
        console.log(err);
        resp.status(201).json({ message:"Internal server Error" });
    }
});


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

app.post("/login",async(req,resp)=>{
    try{
        const existingUser=await User.findOne({username:req.body.username});
        if(existingUser)
        {
            return resp.status(201).json({message :"User already exist!!Sign In instead"});
        }
        const hashedPass=await bcrypt.hash(req.body.password,10);
        let data=new User({username:req.body.username,password:hashedPass,email:req.body.email,contact_no:req.body.contact_no});
        let data1=new Cart({username:req.body.username});
        let result= await data.save();
        let result1=await data1.save();
        console.log(result);
        resp.status(201).json({message:"User created Successfully"});
    }
    catch(err)
    {
        console.log(err);
        resp.status(201).json({message:"Error in creating User"});
    }
});

app.post("/add", async (req, resp) => {
    try {
        const game = await Game.findOne({ gameName: req.body.gameName });

        if (!game) {
            return resp.status(404).json({ message: "Game not found" });
        }

        if (game.quantity <= 0) {
            return resp.status(400).json({ message: "Game out of stock" });
        }

        const user = await Cart.findOne({ username: req.body.username });

        if (!user) {
            return resp.status(401).json({ message: "Login first" });
        }

        user.cart = user.cart || [];
        user.cart.push({ gameName: req.body.gameName, gameCost: req.body.gameCost });
        await user.save();

        game.quantity--; // Decrease the quantity
        await game.save(); // Save the updated game

        resp.status(201).json({ message: "Game added to cart successfully" });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ message: "Error in adding the game to cart" });
    }
});


app.post("/addGame",async(req,resp)=>{
    try{
        let data=new Game({gameName:req.body.gameName,gameCost:req.body.gameCost,quantity:req.body.quantity});
        let result=await data.save();
        console.log(result);
        resp.status(201).json({message:"Game added succesfully"});
    }
    catch(err)
    {
        resp.status(201).json({message:"Game could not be added"});
    }
});

app.post("/addStock",async(req,resp)=>{
    try{
        const game=await Game.findOne({gameName:req.body.gameName});
        if(!game)
        {
            return resp.status(404).json({ message: "Game not found" });
        }
        q=req.body.quantity;
        for(let i=0;i<q;i++)
        {
            game.quantity++;
        }
        await game.save();
        resp.status(201).json({message:"Stock updated successfully"});
    }
    catch(err)
    {
        return resp.status(201).json({message:"Error in updating stock"});
    }
});

app.delete("/deleteFromCart", async (req, resp) => {
    try {
        const username = req.body.username;
        const gameName = req.body.gameName;

        const user = await Cart.findOne({ username: username });
        if (!user) {
            return resp.status(404).json({ message: "User not found" });
        }
        const game=await Game.findOne({gameName:gameName});
        if(!game)
        {
            return resp.status(404).json({message:"game not found"});
        }
        user.cart = user.cart.filter(item => item.gameName != gameName);
        await user.save();

        resp.status(200).json({ message: "Game removed from cart successfully" });
    } catch (err) {
        console.error(err);
        resp.status(500).json({ message: "Error in removing the game from cart" });
    }
});


app.listen(4200);