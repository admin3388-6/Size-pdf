const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mime = require('mime-types');

const app = express();
app.use(cors());

// منع السبام: 1 طلب لكل IP كل 5 ثواني
const limiter = rateLimit({
  windowMs: 5 * 1000,  // كل 5 ثواني
  max: 1,
  message: "⛔ انتظر 5 ثوانٍ قبل رفع ملف آخر"
});
app.use(limiter);

// تخزين الملفات مؤقتًا
const upload = multer({ dest: 'uploads/' });

// ضغط PDF
app.post('/compress', upload.single('file'), async (req, res) => {
  const file = req.file;
  const quality = req.body.quality || 'high';

  if (!file) return res.status(400).send("لم يتم رفع أي ملف");

  // التحقق من نوع MIME للتأكد أنه PDF
  const mimetype = mime.lookup(file.originalname);
  if (mimetype !== 'application/pdf') {
    fs.unlink(file.path, () => {});
    return res.status(400).send("❌ الملف ليس PDF");
  }

  // التحقق من الحجم (≤ 40 MB)
  if (file.size > 40 * 1024 * 1024) {
    fs.unlink(file.path, () => {});
    return res.status(400).send("❌ حجم الملف أكبر من 40MB");
  }

  // preset حسب الجودة
  let preset = 'prepress';
  if (quality === 'medium') preset = 'ebook';
  if (quality === 'low') preset = 'screen';

  const inPath = path.resolve(file.path);
  const outFileName = 'skydata_' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
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
      fs.unlink(file.path, () => {});
      return res.status(500).send(`خطأ في الضغط: ${err.message}`);
    }

    console.log(`Compression finished: ${outFileName}`);
    res.download(outPath, outFileName, () => {
      fs.unlink(file.path, ()=>{});
      fs.unlink(outPath, ()=>{});
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));