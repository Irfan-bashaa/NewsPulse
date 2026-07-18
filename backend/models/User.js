const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

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
        default:""
    },

    avatar:{
        type:String,
        default:""
    },

    provider:{
        type:String,
        default:"email"
    },

    googleId:{
        type:String,
        default:""
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("User",UserSchema);