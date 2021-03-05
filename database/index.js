const sql = require('mssql')
const config = require('../config')

exports.connect = () => {
  return new sql.ConnectionPool(config.mssql)
}

exports.handlePoolError = (res, pool) => {
  pool.on('error', error => {
    console.log('Pool Error')
    console.log(error)
    return res.status(500).json({
      message: 'Pool Error',
      error
    })
  })
}

exports.handlerSqlError = (res, error) => {
  console.log(error)
  return res.status(500).json({ error })
}
