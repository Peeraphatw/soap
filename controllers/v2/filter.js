const sql = require('mssql')
const database = require('../../database')

// Get Employee from empid and status = employed
exports.findEmployee = async (req, res) => {
  let pool = database.connect()
  database.handlePoolError(res, pool)

  try {
    let cmd =
      'SELECT DISTINCT PayId AS EmpId, PayNameFull AS Fullname, Status FROM PayTempTable WHERE PayId = @empId AND Status = 1'

    await pool.connect()
    let result = await pool.request()
    result = await result.input('empId', sql.NVarChar(), req.params.empId)
    result = await result.query(cmd)

    const rows = result.rowsAffected
    const data = result.recordset

    if (rows[0] === 0) {
      //   console.log('result: ', 'cannot find empId', req.params.empId)
      res.json({ rows, data })
    } else {
      //   console.log('result: ', data[0].EmpId, data[0].Fullname)
      res.json({ rows, data })
    }
  } catch (err) {
    database.handlerSqlError(res, err)
  } finally {
    pool.close()
  }
}
