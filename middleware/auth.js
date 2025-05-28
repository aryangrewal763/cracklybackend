const jwt = require('jsonwebtoken')
const jwtSecret = "bsbsfbrnsftentwnnwnwn";
const User = require("../models/User")

exports.auth=async(req,res,next)=>{
    try {
        const token = req.cookies["token"];
        const payload= jwt.verify(token,jwtSecret);
        if(!payload){
            return res.status(400).json({
                success:false,
                message:"Invalid Token",
            })
        }
        const user=await User.findOne({email:payload.email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Please sign in to do so..",
            })
        }
        next();

    } catch (error) {
        return res.status(400).json({
            success:false,
            message:"Error in authentication",
        })
    }
}