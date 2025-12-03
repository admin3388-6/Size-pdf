# Dockerfile

# قاعدة الصورة (نستخدم Node.js)
FROM node:lts-slim

# تحديث وتثبيت Ghostscript والأدوات الأساسية
RUN apt-get update && \
    apt-get install -y ghostscript && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# تعيين دليل العمل
WORKDIR /usr/src/app

# نسخ ملفات المشروع
COPY package*.json ./
RUN npm install

# نسخ كود الخادم
COPY . .

# تعرض البورت (Railway سيتعامل مع هذا تلقائياً)
EXPOSE 3000

# الأمر الافتراضي لتشغيل التطبيق
CMD [ "npm", "start" ]
