const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imageDir = path.join(__dirname, '..', 'uploads', 'images');
const idDir = path.join(__dirname, '..', 'uploads', 'ids');
[imageDir, idDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === 'image' ? imageDir : idDir);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, name);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
