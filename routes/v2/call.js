const express = require('express')

const fnc = require('../../functions')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await fnc.callSoapApi('call')
    res.json({ result })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
})

module.exports = router
