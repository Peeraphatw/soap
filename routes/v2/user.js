const express = require('express')

const v2 = require('../../controllers/v2/user')

const router = express.Router()

router.post('/login', v2.login)
// router.post('/register', v2.register)

module.exports = router
