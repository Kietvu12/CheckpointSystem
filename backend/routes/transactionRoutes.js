import express from 'express'
import TransactionController from '../controllers/transactionController.js'

const router = express.Router()

// Lấy tất cả giao dịch
router.get('/', TransactionController.getAll)

// Lấy giao dịch theo ID
router.get('/:id', TransactionController.getById)

// Lấy giao dịch của người dùng
router.get('/user/:userId', TransactionController.getByUserId)

// Tạo giao dịch mới
router.post('/', TransactionController.create)

// Tạo nhiều giao dịch cùng lúc
router.post('/bulk', TransactionController.createMany)

// Cập nhật giao dịch
router.put('/:id', TransactionController.update)

// Chốt tất cả giao dịch "Giao lịch" chưa chốt
router.patch('/chot-tat-ca', TransactionController.chotTatCaGiaoDich)

// Chốt giao dịch (chuyển từ chưa chốt sang đã chốt)
router.patch('/:id/chot', TransactionController.chotGiaoDich)

// Xóa giao dịch
router.delete('/:id', TransactionController.delete)

export default router

