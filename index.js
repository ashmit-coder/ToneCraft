const pinataSdk = require('@pinata/sdk');
const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { default: axios } = require('axios');
const morgan=require('morgan');


const upload = multer( {dest: 'uploads/' });
require('dotenv').config()
const PORT = process.env.PORT || 5000;
const pinata = new pinataSdk(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

app.use(morgan("combined"))
app.use(express.json({limit:"200mb"}));
app.use(express.urlencoded({limit:"200mb",extended: true ,parameterLimit:5000}));
app.use(cors());

function Verify(req, res, next) {
    // const { user, password } = req.query;
    // if(user !== process.env.USER_ID && password !== process.env.PASSWORD) return res.redirect('/');
    next();
}

function clearUpload(){
    fs.rm(path.join(__dirname,'./uploads'),{recursive:true ,force:true},()=>{
        fs.mkdirSync(path.join(__dirname,'./uploads'))
    })
}

async function pinFile(file){
   const fileStream =  fs.createReadStream(path.resolve(__dirname,file.path));
   const options = {
    pinataMetadata: {
                name: file.filename
                },
    pinataOptions: {
                cidVersion: 0
            }
        }
    try{

        let Data = await pinata.pinFileToIPFS(fileStream,options)
        if(Data) return Data
    }
    catch(err){
        console.log(err);
        throw {success:false}
    }

    
}

app.get('/', async (req, res) => {
    let result = await pinata.testAuthentication();
    return res.json(result);
});

app.use(Verify);

app.post('/api/upload',upload.single('audio') ,async (req, res) => {

    try {

        const files = fs.readFileSync(path.resolve(__dirname,`./uploads/${req.file.filename}`));

        const form = new FormData();
        
        form.append('file',files);

        const response =  await axios.post(`${process.env.ML_URL}upload/`,files, {
            headers: {
                'Content-Type':'multipart/form-data'
            },
            responseType:"arraybuffer"
        });

        const audioBuffer = Buffer.from(response.data);
        const audioFilePath = 'combined_audio.mp3';
        
        const file = fs.writeFileSync(audioFilePath,audioBuffer,{encoding:"binary"});
         
        pinFile({path:path.resolve(__dirname,"./combined_audio.mp3"), filename:req.file.filename }).
        then(result=>{
            res.json(result);
            clearUpload();
            fs.rm(path.join(__dirname,"./combined_audio.mp3"),()=>{
                console.log("file deleted")
            });
        })
        .catch(err=>{
            res.status(500).json(err);
        })
        
    } 
    catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }

    return res;
});

app.post('/api/nft',async (req, res) => {
    
    try{
    const options = {
        pinataOptions: {
            cidVersion: 0
        }
    };
    const body=JSON.parse(req.body.data);
    console.log(req.body,"request body");
    const result = await pinata.pinJSONToIPFS(body, options);

    res.json(result);
    }
    catch(err){
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
 
    return res;
});

// app.get('/test', async (req, res) => {

//     try {
      
//         const files = fs.readFileSync(path.resolve(__dirname,'./uploads/manas.pdf'));

//         const form = new FormData();
        
//         form.append('file',files);

//         const response =  await axios.post('http://127.0.0.1:5000/upload/',files, {
//             headers: {
//                 'Content-Type':'multipart/form-data'
//             },
//             responseType:"arraybuffer"
//         });
 
//         const audioBuffer = Buffer.from(response.data);
//         const audioFilePath = 'combined_audio.mp3';
        
//         const file = fs.writeFileSync(audioFilePath,audioBuffer,{encoding:"binary"})
//         let result = await pinFile({path:path.resolve(__dirname,"./combined_audio.mp3"), filename:"hmm" });
//         if(result){

//             clearUpload();
//             fs.rm(path.join(__dirname,"./combined_audio.mp3"),()=>{
//             console.log("Removing audio file")
//             });
    
//         }
//         return res.json(result);

//     } catch (error) {
//         console.error(error);
//         return res.status(500).send('Internal Server Error');
//     }

// })

app.listen(PORT, () => {
    console.log('Listening to port 5000....');
});