
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const imageUploadDir = path.join(__dirname, '..', 'uploads', 'images');
const idUploadDir = path.join(__dirname, '..', 'uploads', 'ids');
[imageUploadDir, idUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.fieldname === 'image' ? imageUploadDir : idUploadDir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, unique);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

exports.upload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'govtId', maxCount: 1 },
]);

function fileUrl(req, storedPath) {
    if (!storedPath) return null;
    const rel = storedPath.split(path.sep).slice(-3).join('/');
    return `${req.protocol}://${req.get('host')}/${rel}`;
}


exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ error: 'firstName, lastName & email are required' });
        }

        const imagePath = req.files.image?.[0]?.path || null;
        const govtIdPath = req.files.govtId?.[0]?.path || null;

        const user = await prisma.user.create({
            data: { firstName, lastName, email, phone, image: imagePath, govtId: govtIdPath }
        });

        return res.status(201).json({
            ...user,
            imageUrl: fileUrl(req, imagePath),
            govtIdUrl: fileUrl(req, govtIdPath),
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        const result = users.map(u => ({
            ...u,
            imageUrl: fileUrl(req, u.image),
            govtIdUrl: fileUrl(req, u.govtId),
        }));
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (!u) return res.status(404).json({ error: 'User not found' });
        res.json({
            ...u,
            imageUrl: fileUrl(req, u.image),
            govtIdUrl: fileUrl(req, u.govtId),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.updateUser = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const exists = await prisma.user.findUnique({ where: { id } });
        if (!exists) return res.status(404).json({ error: 'User not found' });

        const data = {};
        ['firstName', 'lastName', 'email', 'phone'].forEach(f => {
            if (req.body[f]) data[f] = req.body[f];
        });

        if (req.files.image) data.image = req.files.image[0].path;
        if (req.files.govtId) data.govtId = req.files.govtId[0].path;

        const updated = await prisma.user.update({ where: { id }, data });
        res.json({
            ...updated,
            imageUrl: fileUrl(req, updated.image),
            govtIdUrl: fileUrl(req, updated.govtId),
        });
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ error: 'Email already exists' });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const deleteFileIfExists = (filePath) => {
            if (!filePath) return;

            try {
                const absolutePath = path.join(__dirname, '..', filePath);
                const normalizedPath = path.normalize(absolutePath);

                if (fs.existsSync(normalizedPath)) {
                    fs.unlinkSync(normalizedPath);
                    console.log(`Deleted file: ${normalizedPath}`);
                } else {
                    console.warn(`File not found: ${normalizedPath}`);
                }
            } catch (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            }
        };

        deleteFileIfExists(user.image);
        deleteFileIfExists(user.govtId);

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error in deleteUser:', err);
        res.status(500).json({
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
