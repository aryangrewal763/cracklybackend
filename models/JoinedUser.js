const mongoose=require('mongoose');

const joinedUserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
},{timestamps:true});

const JoinedUser=mongoose.model("JoinedUser",joinedUserSchema);
module.exports=JoinedUser;