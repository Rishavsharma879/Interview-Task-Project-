const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

function fileUrl(req, storedPath) {
    if (!storedPath) return null;
    const rel = path.relative(path.join(__dirname, '..', 'uploads'), storedPath);
    return `${req.protocol}://${req.get('host')}/uploads/${rel.replace(/\\/g, '/')}`;
}

exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address } = req.body;
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ error: 'firstName, lastName & email are required' });
        }

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone || null,
                address: address || null,
                image: req.files?.image?.[0]?.path || null,
                govtId: req.files?.govtId?.[0]?.path || null
            }
        });

        return res.status(201).json({
            ...user,
            imageUrl: fileUrl(req, user.image),
            govtIdUrl: fileUrl(req, user.govtId),
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({ 
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                image: true,
                govtId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        const result = users.map(user => ({
            ...user,
            imageUrl: fileUrl(req, user.image),
            govtIdUrl: fileUrl(req, user.govtId),
        }));
        
        res.json(result);
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const user = await prisma.user.findUnique({ 
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                image: true,
                govtId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            ...user,
            imageUrl: fileUrl(req, user.image),
            govtIdUrl: fileUrl(req, user.govtId),
        });
    } catch (err) {
        console.error('Get user by ID error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const { firstName, lastName, email, phone, address } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) return res.status(404).json({ error: 'User not found' });

        const data = {
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            email: email || existingUser.email,
            phone: phone || existingUser.phone,
            address: address || existingUser.address,
        };

        if (req.files?.image?.[0]?.path) data.image = req.files.image[0].path;
        if (req.files?.govtId?.[0]?.path) data.govtId = req.files.govtId[0].path;

        const updatedUser = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                image: true,
                govtId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            ...updatedUser,
            imageUrl: fileUrl(req, updatedUser.image),
            govtIdUrl: fileUrl(req, updatedUser.govtId),
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const deleteFile = async (filePath) => {
            if (!filePath) return;
            
            try {
                const absolutePath = path.join(__dirname, '..', filePath);
                if (fs.existsSync(absolutePath)) {
                    await fs.promises.unlink(absolutePath);
                }
            } catch (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            }
        };

        await Promise.all([
            deleteFile(user.image),
            deleteFile(user.govtId)
        ]);

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

