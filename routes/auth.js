// user sign in
const express=require('express');
const router=express.Router();
const Joi=require('joi');
const bcrypt=require('bcrypt');
const passwordComplexity=require('joi-password-complexity');
const { User }=require('../models/user');

const complexityOptions={
    min:15,
    max:30,
    lowerCase:2,
    upperCase:2,
    symbol:1,
    numeric:2,
    requirementCount:5
}

router.post('/',async (req,res)=>{
    const { error }=validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // does this user exist
    let user=await User.findOne({email:req.body.email});
    if(!user) return res.status(400).send('Invalid email or password');

    const validPassword=await bcrypt.compare(req.body.password,user.password);
    if(!validPassword) return res.status(400).send('Invalid email or password');

    const token=user.generateAuthToken();

    res.send(token);

});

function validate(req){
    const schema=Joi.object({
        email:Joi.string().email({minDomainSegments: 2, tlds: { allow: ['com'] }}).required(),
        password:passwordComplexity(complexityOptions).required()
        
    })
    return schema.validate(req);
};

module.exports=router;