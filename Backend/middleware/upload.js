


const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDirs = () => {
    const imageDir = path.join(__dirname, '..', 'uploads', 'images');
    const idDir = path.join(__dirname, '..', 'uploads', 'ids');
    
    [imageDir, idDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'image' 
            ? path.join(__dirname, '..', 'uploads', 'images')
            : path.join(__dirname, '..', 'uploads', 'ids');
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
    }
};


const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 2 
    }
});

module.exports = upload;
