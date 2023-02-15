const mongoose=require('mongoose');
const Joi=require('joi');
const passwordComplexity=require('joi-password-complexity');

const complexityOptions={
    min:15,
    max:30,
    lowerCase:2,
    upperCase:2,
    symbol:1,
    numeric:2,
    requirementCount:5
}

const Recovery=mongoose.model('recoveraccount',new mongoose.Schema({
    email:{
        type:String,
        required:true  
            },
    systemCode:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
}))

function validateRecoveryRequest(req){
    const schema=Joi.object({
        email:Joi.string().email({minDomainSegments: 2, tlds: { allow: ['com'] }}).required()
    })
    return schema.validate(req)
}

function validateCode(req){
    const schema=Joi.object({
        email:Joi.string().email({minDomainSegments: 2, tlds: { allow: ['com'] }}).required(),
        password:passwordComplexity(complexityOptions).required(),
        repeat_password: Joi.ref('password'),
        code:Joi.string().required()


    })
    .with('password', 'repeat_password')
    return schema.validate(req)

}

module.exports.RecoverAccount=Recovery;
module.exports.validateRecoveryRequest=validateRecoveryRequest;
module.exports.validateCode=validateCode;
