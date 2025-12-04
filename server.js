const express = require('express');
const multer  = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// تخزين الملفات مؤقتًا
const upload = multer({ dest: 'uploads/' });

// ضغط PDF باستخدام Ghostscript
app.post('/compress', upload.single('file'), async (req, res) => {
    const file = req.file;
    const quality = req.body.quality || 'high';

    if (!file) {
        return res.status(400).send("لم يتم رفع أي ملف");
    }

    // تحديد preset حسب الجودة
    let preset = 'prepress'; // عالي
    if (quality === 'medium') preset = 'ebook';
    if (quality === 'low') preset = 'screen';

    // مسارات آمنة
    const inPath = path.resolve(file.path);
    const outFileName = 'compressed_' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const outPath = path.resolve('uploads', outFileName);

    console.log(`Compressing: ${file.originalname} -> ${outFileName} with preset ${preset}`);

    execFile('gs', [
        '-sDEVICE=pdfwrite',
        `-dPDFSETTINGS=/${preset}`,
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE','-dQUIET','-dBATCH',
        `-sOutputFile=${outPath}`,
        inPath
    ], (err, stdout, stderr) => {
        if (err) {
            console.error("Ghostscript error:", err);
            console.error("stdout:", stdout);
            console.error("stderr:", stderr);
            fs.unlink(file.path, ()=>{});
            return res.status(500).send(`خطأ في الضغط: ${err.message}`);
        }

        console.log(`Compression finished: ${outFileName}`);
        res.download(outPath, `skydata_${file.originalname}`, () => {
            fs.unlink(file.path, ()=>{});
            fs.unlink(outPath, ()=>{});
        });
    });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
