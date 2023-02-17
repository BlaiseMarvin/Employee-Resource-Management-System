const express=require('express');
const config=require('config');
const app=express();
app.use(express.json());

if(!config.get('jwtPrivateKey') || !config.get('API_KEY')){
    console.error('FATAL Error: jwtPrivateKey and API_KEY not defined');
    process.exit(1);
}

const home=require('./routes/home');
const user=require('./routes/users');
const http=require('http');
const server=http.createServer(app);
const socketio=require('socket.io');
const io=socketio(server);

app.use('/',home);
app.use('/api/users',user);

const mongoose=require('mongoose');

mongoose.connect('mongodb://localhost:27017/kmc_digital')
.then(()=>console.log('connected to mongodb'))
.catch(e=>console.log('Failed to connect to mongodb'))


const port=process.env.PORT || 3000;

server.listen(port,()=>console.log(`Listening to changes on port ${port}`))