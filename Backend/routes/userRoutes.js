
const express = require('express');
const multer = require('../middleware/upload');
const router = express.Router();
const {
  upload,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');


const fileFields = multer.fields([
  { name: 'image', maxCount: 1 },
  { name: 'govtId', maxCount: 1 }
]);

router
  .route('/users')
  .post(fileFields, createUser)    
  .get(getAllUsers);               

router
  .route('/users/:id')
  .get(getUserById)               
  .put(fileFields, updateUser)    
  .delete(deleteUser);             

module.exports = router;
