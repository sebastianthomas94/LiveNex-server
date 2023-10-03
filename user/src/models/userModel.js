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
},

{
    timestamps : true
})

const User = mongoose.model('User',userSchema);
export default User;