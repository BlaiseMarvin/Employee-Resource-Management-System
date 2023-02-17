const jwt=require('jsonwebtoken');
const config=require('config');

function auth(req,res,next){
    const token=req.header('x-auth-token');
    if(!token) return res.status(401).send('Access is denied. No token provided');

    try{
        const payload=jwt.verify(token,config.get('jwtPrivateKey'));
        req.user=payload;
        next();
    } catch(e){
        res.status(400).send('Invalid token');
    }
}

module.exports=auth;