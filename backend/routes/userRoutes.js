import express from 'express'
import UserController from '../controllers/userController.js'

const router = express.Router()

// Lấy tất cả người dùng
router.get('/', UserController.getAll)

// Lấy người dùng theo ID
router.get('/:id', UserController.getById)

// Tạo người dùng mới
router.post('/', UserController.create)

// Tạo nhiều người dùng cùng lúc
router.post('/bulk', UserController.createMany)

// Cập nhật người dùng
router.put('/:id', UserController.update)

// Xóa người dùng
router.delete('/:id', UserController.delete)

export default router

