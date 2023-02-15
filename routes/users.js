const config=require('config');
const { User,validate }=require('../models/user');
const express=require('express');
const router=express.Router();
const _=require('lodash');
const bcrypt=require('bcrypt');
const Fawn=require('fawn');
const mongoose=require('mongoose');
const crypto=require('crypto');
const { TempUser,tempValidate }=require('../models/temporaryUser');
const sgMail=require('@sendgrid/mail');
const {RecoverAccount,validateRecoveryRequest,validateCode}=require('../models/temporaryRecoveryUser');
const API_KEY=config.get('API_KEY');

Fawn.init(mongoose);
sgMail.setApiKey(API_KEY);


router.get('/',async (req,res)=>{
    const users=await User.find().sort('firstName').select('-password')
    res.status(200).send(users);
})


router.post('/',async(req,res)=>{
    const { error }=validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    
    // Is the user already in existence?
    const userExists=await User.findOne({email:req.body.email});
    if(userExists) return res.status(400).send('User already exists');

    
    const user=new User(_.pick(req.body,['firstName','lastName','email','password','position','department']));

    const salt=await bcrypt.genSalt(10);
    user.password=await bcrypt.hash(user.password,salt);

    // await user.save();

    // generate a crypto token
    const systemToken = crypto.randomBytes(4).toString('hex');
    const temporaryRecord=new TempUser({
                                            id: user._id,
                                            systemCode:systemToken
                                        });
    // await temporaryRecord.save(); 

    // Both save or nothing => 
    try{
        new Fawn.Task()
        .save('users',user)
        .save('unconfirmedusers',temporaryRecord)
        .run();

        
    } catch(e){
        return res.status(500).send('Unable to register user');
    }
    const message={
        to:user.email,
        from: 'bmrusoke@kiiramotors.com',
        subject: 'Confirmation Code',
        text:`Your confirmation code is ${systemToken}`
    }
    await sgMail.send(message);
        


        // Send the jwt auth token back to the user in the header
        // const token=user.generateAuthToken();

        // return res.header('x-auth-token',token).status(200).send(_.pick(user,['_id','firstName','lastName','email','position','department']));
    return res.status(200).send(_.pick(user,['_id','firstName','lastName','email','position','department','confirmed']));
    
          
});

// Create this route below where users input the system generated code read from their emails
// this code ought to match with what is in the database
// once this is the case, change their status to confirmed to true
// delete the unconfirmed record

router.post('/confirm',async (req,res)=>{
    
    const { error } = tempValidate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user_id=await User.findOne({email:req.body.email}).select('_id');
    
    if(!user_id) return res.status(400).send('You have to sign up before confirming your account');
    
    user_id=user_id._doc._id;
    
    let systemCode=await TempUser.findOne({id:user_id}).select('systemCode');
    
    if(!systemCode) return res.status(400).send('You have to sign up before confirming your account');

    systemCode=systemCode.systemCode;

    if(systemCode===req.body.code){
        
        try{
        
            new Fawn.Task()
            .update('users',{_id:user_id},{confirmed:true})
            .remove("unconfirmedusers",{id:user_id})
            .run()

            return res.status(200).send(` ${user_id} confirmed`);

        }
        catch(e){
            return res.status(500).send('Unable to confirm account');
        }
            
    } else{
        res.status(400).send('Invalid code');
    }


})

// create functionality for this below
// account recovery => reset password? 
router.post('/recovery',async (req,res)=>{
    // user sends us their email 
    const { error }=validateRecoveryRequest(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // does the user exist in the database
    const user=await User.findOne({email:req.body.email});
    if(!user) return res.status(400).send('User does not exist');

    // send an email with a code
    const systemToken = crypto.randomBytes(4).toString('hex');
    const temporaryRecoveryRecord=new RecoverAccount({
                                        email:req.body.email,
                                        systemCode:systemToken
                                        });

    

        
    await temporaryRecoveryRecord.save();

    const message={
        to:user.email,
        from: 'bmrusoke@kiiramotors.com',
        subject: 'Recovery Code',
        text:`Your recovery code is ${systemToken}`
    }
    await sgMail.send(message);

    
    res.status(200).send('Code sent');

})

router.post('/recovery/confirm', async (req,res)=>{
    const { error }=validateCode(req.body)
    if(error) return res.status(400).send(error.details[0].message);
    
    const user=await User.findOne({email:req.body.email});
    if(!user) return res.status(400).send('User does not exist, please create account instead');

    // extract this user's last code in the database
    let latestRecoveryCode=await RecoverAccount.find({email:req.body.email}).sort({date:-1}).select({systemCode:1}).limit(1)
    
    
    if(!latestRecoveryCode.length) return res.status(400).send('Request for a recovery code first');

    latestRecoveryCode=latestRecoveryCode[0]._doc.systemCode;
    // compare this code with the users' code
    if(req.body.code===latestRecoveryCode){
        // reset their password
        const salt=await bcrypt.genSalt(10);
        const newPassword=await bcrypt.hash(req.body.password,salt);

        const updatedUser=await User.findByIdAndUpdate(user._id,{
                                                                    $set:{
                                                                        password:newPassword
                                                                    }
                                                                                            },{new:true});
        

        // delete multiple records from the recovery database 
        await RecoverAccount.deleteMany({email:req.body.email});                                                                                    
        
        return res.status(200).send(_.pick(updatedUser,['_id','firstName','lastName','email','position','department','confirmed']));
                                                                               

    } else{
        return res.status(400).send('Invalid Recovery Code');
    }


})
// router.get('/recoveryread', async (req,res)=>{
//     const reads=await RecoverAccount.find().sort({date:-1}).limit(1)
//     res.send(reads);
// })


module.exports=router;