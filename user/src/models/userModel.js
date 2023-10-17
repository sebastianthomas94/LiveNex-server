import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email :{
        type:String,
        require:true,
        unique: true
    },
    password:{
        type:String,
        require:false
    },
    name:{
        type:String,
        require:true
    },
    youtube:{
        accessToken:String,
        refreshTocken:String,
        rtmpUrl:String,
        photo: String,
    }
    ,
    google:{
        accessToken:String,
        refreshTocken:String,
        photo: String,
    },
    instagram:{
        accessToken:String,
        refreshTocken:String,
        rtmpUrl:String,
        photo: String,
    },
    twitch:{
        accessToken:String,
        refreshTocken:String,
        rtmpUrl:String,
        photo: String,
    }
},

{
    timestamps : true
})

const User = mongoose.model('User',userSchema);
export default User;