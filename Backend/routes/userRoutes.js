
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');

const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'govtId', maxCount: 1 }
]);

router.route('/users')
    .get(getAllUsers)
    .post(uploadFields, createUser);

router.route('/users/:id')
    .get(getUserById)
    .put(uploadFields, updateUser)
    .delete(deleteUser);

module.exports = router;
