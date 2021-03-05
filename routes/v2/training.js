const express = require('express')

const v2 = require('../../controllers/v2/training')

const router = express.Router()

router.get('/hr', v2.getTraining)
router.get('/hr/details-v2/:journalId', v2.getTrainingDetails)

module.exports = router
