// Database for temporary codes
const mongoose=require('mongoose');
const Joi=require('joi');

const TemporaryUser=mongoose.model('unconfirmeduser',new mongoose.Schema({
                                                                            id:{
                                                                            type:String,
                                                                            required:true,
                                                                            unique:true
                                                                            },
                                                                            systemCode:{
                                                                            type:String,
                                                                            required:true
                                                                            }

                                                                                                }))
function validateTemporaryUser(req){
    const schema=Joi.object({
        code:Joi.string().required(),
        email:Joi.string().email({minDomainSegments: 2, tlds: { allow: ['com'] }})
    })
    return schema.validate(req);
}

module.exports.tempValidate=validateTemporaryUser;
module.exports.TempUser=TemporaryUser;