const express = require('express')

const v2 = require('../../controllers/v2/recordTime')

const router = express.Router()

router.post('/', v2.recordTime)
router.post('/walkIn', v2.recordTimeWalkIn)

module.exports = router
