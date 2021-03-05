const express = require('express')
const v2 = require('../../controllers/v2/filter')

const router = express.Router()

router.get('/employee/:empId', v2.findEmployee)

module.exports = router
