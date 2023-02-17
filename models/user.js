const mongoose=require('mongoose');
const Joi=require('joi');
const passwordComplexity=require('joi-password-complexity');
const config=require('config');
const jwt=require('jsonwebtoken');

const complexityOptions={
    min:15,
    max:30,
    lowerCase:2,
    upperCase:2,
    symbol:1,
    numeric:2,
    requirementCount:5
}

const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:50
    },
    lastName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:50
    },
    email:{
        type:String,
        required:true,
        minlength:3,
        maxlength:50,
        unique:true,
        match:/@kiiramotors.com$/i
    },
    password:{
        type:String,
        required:true
    },
    position:{
        type:String,
        required:true
    },
    department:{
        type:String,
        required:true,
        enum:['Product Development','Production','Marketing and Sales','Operational Support','Compliance and Risk Management','Executive','Other']
    },
    confirmed:{
        type:Boolean,
        default:false
    }
});

userSchema.methods.generateAuthToken=function(){
    const token=jwt.sign({_id:this._id},config.get('jwtPrivateKey'));
    return token
}

const User=mongoose.model('User',userSchema);



function validateUser(user){
    const schema=Joi.object({
        firstName:Joi.string().alphanum().min(3).max(50).required(),
        lastName:Joi.string().alphanum().min(3).max(50).required(),
        email:Joi.string().email({minDomainSegments: 2, tlds: { allow: ['com'] }}).required(),
        password:passwordComplexity(complexityOptions).required(),
        repeat_password: Joi.ref('password'),
        position:Joi.string().min(1).max(100).required(),
        department:Joi.string().min(3).max(100).required()
    })
    .with('password', 'repeat_password')
    return schema.validate(user);
}


module.exports.User=User;
module.exports.validate=validateUser;