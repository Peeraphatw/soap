const sql = require('mssql')
const database = require('../../database')
const config = require('../../config')

exports.login = async (req, res) => {
  const { empId, fromApp } = req.body

  let pool = database.connect()
  database.handlePoolError(res, pool)
  // console.log(empId)

  try {
    let cmdUser =
      'SELECT PayId, PayNameFull FROM PayTempTable WHERE PayId = @empId AND Status = 1'
    let cmdHR =
      'SELECT PayId, PayNameFull FROM PayTempTable WHERE Dimension2_ = @costcenter AND PayId = @empId AND Status = 1'

    let cmd = fromApp == 'hr' ? cmdHR : cmdUser

    await pool.connect()
    let result = await pool.request()
    result = await result.input('empId', sql.NVarChar(), empId)
    result = await result.input(
      'costcenter',
      sql.NVarChar(),
      config.hr.costcenter
    )
    result = await result.query(cmd)

    const rows = result.rowsAffected
    const data = result.recordset

    if (rows[0] === 0) {
      //   console.log('login failed, empId is incorrect.')
      return res.json({
        message: 'เข้าสู่ระบบไม่สำเร็จ รหัสพนังานไม่ถูกต้อง',
        rows
      })
    }

    // console.log('login succeed. ', data[0].PayId, data[0].PayNameFull)
    // console.log('fromApp:', fromApp)

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      rows,
      data
    })
  } catch (error) {
    database.handlerSqlError(res, error)
  } finally {
    pool.close()
  }
}
