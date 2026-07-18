const User=require("../models/User");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const { auth } = require("../config/firebaseAdmin");

exports.register=async(req,res)=>{

try{

const {name,email,password}=req.body;

if(!name||!email||!password){

return res.status(400).json({
message:"All fields required"
});

}

const existing=await User.findOne({
email:email.toLowerCase()
});

if(existing){

return res.status(400).json({
message:"Email already exists"
});

}

const hashedPassword=await bcrypt.hash(password,10);

const user=await User.create({

name,
email:email.toLowerCase(),
password:hashedPassword

});

const token=jwt.sign(

{id:user._id},
process.env.JWT_SECRET,
{expiresIn:"30d"}

);

res.json({

token,

user:{
id:user._id,
name:user.name,
email:user.email
}

});

}

catch(err){

console.log(err);

res.status(500).json({

message:"Server Error"

});

}

};
exports.login= async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const validPassword =
      await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

exports.googleLogin = async (req, res) => {
  try {

const { idToken } = req.body;

if (!idToken) {
  return res.status(400).json({
    message: "ID Token required"
  });
}

const decoded = await auth.verifyIdToken(idToken);
console.log(decoded);
    const {
      uid,
      email,
      name,
      picture
    } = decoded;

    let user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {

  console.log("Creating Google user...");

  try {

    user = await User.create({
      name,
      email: email.toLowerCase(),
      avatar: picture,
      provider: "google",
      googleId: uid,
      password: ""
    });

    console.log("✅ User created successfully");
    console.log(user);

  } catch (err) {

    console.log("❌ CREATE ERROR");
    console.log(err);

    return res.status(500).json({
      message: err.message
    });

  }

}

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Google Login Failed"
    });

  }
};