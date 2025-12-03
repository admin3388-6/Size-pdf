// server.js

const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// إعداد التخزين المؤقت للملفات المحملة
const upload = multer({ dest: 'uploads/' });

// التأكد من وجود مجلد التحميل
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ----------------------------------------------------------------
// 🌟 نقطة نهاية API لعملية الضغط
// ----------------------------------------------------------------
app.post('/compress', upload.single('pdfFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('لم يتم إرسال ملف PDF.');
    }

    const inputPath = req.file.path; // المسار المؤقت للملف الذي تم تحميله
    const outputFileName = `compressed_${req.file.originalname}`;
    const outputPath = path.join('uploads', outputFileName);

    // 🔑 أمر Ghostscript القوي لتقليل الحجم مع جودة جيدة
    // يمكنك تغيير /ebook إلى /screen أو /printer لتغيير مستوى الضغط
    // تم إضافة علامتي اقتباس مفردة (') حول المسارات
const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sOutputFile='${outputPath}' '${inputPath}'`;    // تشغيل الأمر
    exec(gsCommand, (error, stdout, stderr) => {
        // تنظيف ملف الإدخال المؤقت فوراً
        fs.unlinkSync(inputPath);

        if (error) {
            console.error(`خطأ Ghostscript: ${error.message}`);
            // محاولة حذف ملف الإخراج إذا تم إنشاؤه جزئيًا
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            return res.status(500).send('فشلت عملية الضغط المتقدمة.');
        }

        if (fs.existsSync(outputPath)) {
            // إرسال الملف المضغوط إلى العميل
            res.download(outputPath, outputFileName, (err) => {
                // تنظيف الملف المضغوط المؤقت بعد الإرسال
                fs.unlinkSync(outputPath);
                if (err) {
                    console.error('خطأ في إرسال الملف:', err);
                }
            });
        } else {
            res.status(500).send('فشلت عملية إنشاء ملف الإخراج.');
        }
    });
});

// ----------------------------------------------------------------
// تشغيل السيرفر
// ----------------------------------------------------------------
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
