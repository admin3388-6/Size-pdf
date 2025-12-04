const express = require('express');
const multer  = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/compress', upload.single('file'), async (req, res)=>{
    const file = req.file;
    const quality = req.body.quality || 'high';
    const outFile = path.join('uploads', 'compressed_'+file.originalname);

    let preset = 'prepress'; // عالي
    if(quality==='medium') preset='ebook';
    if(quality==='low') preset='screen';

    execFile('gs', [
        '-sDEVICE=pdfwrite',
        `-dPDFSETTINGS=/${preset}`,
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE','-dQUIET','-dBATCH',
        `-sOutputFile=${outFile}`,
        file.path
    ], (err)=>{
        if(err){ res.status(500).send("خطأ في الضغط"); return;}
        res.download(outFile, `skydata_${file.originalname}`, ()=>{
            fs.unlink(file.path, ()=>{});
            fs.unlink(outFile, ()=>{});
        });
    });
});

app.listen(process.env.PORT || 3000, ()=>{ console.log("Server running"); });
