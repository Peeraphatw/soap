const sql = require('mssql')
const database = require('../../database')

exports.getTraining = async (req, res) => {
  let pool = database.connect()
  database.handlePoolError(res, pool)

  try {
    let cmd =
      'SELECT HRMTRAININGJOURNALTABLE.JournalId, HRMTRAININGJOURNALTABLE.Description, HRMCOURSESROOM.Description AS Location, '
    cmd +=
      'CONVERT(VARCHAR, HRMTRAININGJOURNALTABLE.StartDate, 103) AS StartDate, CONVERT(VARCHAR, HRMTRAININGJOURNALTABLE.EndDate, 103) AS EndDate, '
    cmd +=
      'HRMTRAININGJOURNALTABLE.CourseFromTime AS FromTime, HRMTRAININGJOURNALTABLE.CourseToTime AS ToTime, HRMTRAININGJOURNALTABLE.HRMCoursesId AS CoursId '
    cmd +=
      'FROM HRMTRAININGJOURNALTABLE INNER JOIN HRMCOURSESROOM ON HRMTRAININGJOURNALTABLE.HRMCoursesRoomId = HRMCOURSESROOM.HRMCoursesRoomId '
    cmd +=
      'WHERE HRMTRAININGJOURNALTABLE.StartDate <= @today AND HRMTRAININGJOURNALTABLE.EndDate >= @today '
    cmd +=
      'ORDER BY HRMTRAININGJOURNALTABLE.StartDate DESC, HRMTRAININGJOURNALTABLE.EndDate DESC, HRMTRAININGJOURNALTABLE.CourseFromTime DESC'

    await pool.connect()
    let result = await pool.request()
    result = await result.input('today', sql.Date(), new Date())
    result = await result.query(cmd)

    const rows = result.rowsAffected
    let data = result.recordset

    for (var i = 0; i < rows; i++) {
      // count line
      let cmd2 =
        'SELECT Count(PersonNumber) AS Amount FROM HRMTRAININGJOURNALTRANS WHERE JournalId = @journalId AND StartDate = @today AND EndDate = @today'
      //คนที่เข้าแล้วช่วงเช้า
      let cmd3 =
        'SELECT Count(Learn) AS AM FROM HRMTRAININGJOURNALTRANS WHERE JournalId = @journalId AND Learn = 1 AND StartDate = @today AND EndDate = @today'
      //คนที่เข้าแล้วช่วงบ่าย
      let cmd4 =
        'SELECT Count(Learn) AS PM FROM HRMTRAININGJOURNALTRANS WHERE JournalId = @journalId AND HRLearn = 1 AND StartDate = @today AND EndDate = @today'

      let result2 = await pool.request()
      result2 = await result2.input(
        'journalId',
        sql.NVarChar(),
        data[i].JournalId
      )
      result2 = await result2.input('today', sql.Date(), new Date())
      result2 = await result2.query(cmd2)

      let result3 = await pool.request()
      result3 = await result3.input(
        'journalId',
        sql.NVarChar(),
        data[i].JournalId
      )
      result3 = await result3.input('today', sql.Date(), new Date())
      result3 = await result3.query(cmd3)

      let result4 = await pool.request()
      result4 = await result4.input(
        'journalId',
        sql.NVarChar(),
        data[i].JournalId
      )
      result4 = await result4.input('today', sql.Date(), new Date())
      result4 = await result4.query(cmd4)

      data[i].Amount = result2.recordset[0].Amount
      data[i].AM = result3.recordset[0].AM
      data[i].PM = result4.recordset[0].PM
    }

    // console.log(data)
    //console.log('ดึงข้อมูลสำเร็จ');
    res.json({
      message: 'ดึงข้อมูลสำเร็จ',
      rows,
      data
    })
  } catch (error) {
    database.handlerSqlError(res, error)
  } finally {
    pool.close()
  }
}

exports.getTrainingDetails = async (req, res) => {
  const journalId = req.params.journalId

  if (!journalId) {
    return res.status(400).json({ message: 'มีข้อมูลมาไม่ครบถ้วน' })
  }

  let pool = database.connect()
  database.handlePoolError(res, pool)

  let cmd =
    "SELECT DISTINCT HRMTRAININGJOURNALTABLE.Description, LTRIM(REPLACE(REPLACE(REPLACE(HRMTRAININGJOURNALTRANS.PayNameFull, 'น.ส.', ''), 'นาย', ''), 'นาง', '')) AS Fullname, "
  cmd +=
    'HRMTRAININGJOURNALTRANS.Learn AS AM, HRMTRAININGJOURNALTRANS.HRLearn AS PM, HRMTRAININGJOURNALTRANS.PersonNumber AS EmpId, HRMTRAININGJOURNALTRANS.TimeAM, HRMTRAININGJOURNALTRANS.TimePM, '
  cmd +=
    'DIMENSIONS.Description AS Department, DIMENSIONS.Num AS DepartmentId, HRMTRAININGJOURNALTRANS.Sex AS Gender, HRMTRAININGJOURNALTRANS.CompanyId AS Company '
  cmd +=
    'FROM HRMTRAININGJOURNALTABLE INNER JOIN HRMTRAININGJOURNALTRANS ON HRMTRAININGJOURNALTABLE.JournalId = HRMTRAININGJOURNALTRANS.JournalId '
  cmd +=
    'INNER JOIN DIMENSIONS ON HRMTRAININGJOURNALTRANS.Dimension2_ = DIMENSIONS.Num '
  cmd +=
    'WHERE HRMTRAININGJOURNALTABLE.JournalId = @journalId AND HRMTRAININGJOURNALTRANS.StartDate = @today AND HRMTRAININGJOURNALTRANS.EndDate = @today '
  // cmd += "ORDER BY LTRIM(REPLACE(REPLACE(REPLACE(HRMTRAININGJOURNALTRANS.PayNameFull, 'น.ส.', ''), 'นาย', ''), 'นาง', ''))"

  let cmd2 =
    "SELECT DISTINCT HRMTRAININGJOURNALTABLE.Description, LTRIM(REPLACE(REPLACE(REPLACE(HRMTRAININGJOURNALTRANS.PayNameFull, 'น.ส.', ''), 'นาย', ''), 'นาง', '')) AS Fullname, "
  cmd2 +=
    'HRMTRAININGJOURNALTRANS.Learn AS AM, HRMTRAININGJOURNALTRANS.HRLearn AS PM, HRMTRAININGJOURNALTRANS.PersonNumber AS EmpId, HRMTRAININGJOURNALTRANS.TimeAM, '
  cmd2 +=
    'HRMTRAININGJOURNALTRANS.TimePM, HRMTRAININGJOURNALTRANS.Sex AS Gender, HRMTRAININGJOURNALTRANS.CompanyId AS Company '
  cmd2 +=
    'FROM HRMTRAININGJOURNALTABLE INNER JOIN HRMTRAININGJOURNALTRANS ON HRMTRAININGJOURNALTABLE.JournalId = HRMTRAININGJOURNALTRANS.JournalId '
  cmd2 +=
    'WHERE HRMTRAININGJOURNALTABLE.JournalId = @journalId AND HRMTRAININGJOURNALTRANS.StartDate = @today AND HRMTRAININGJOURNALTRANS.EndDate = @today '
  cmd2 += "AND HRMTRAININGJOURNALTRANS.Dimension2_ = ''"
  // cmd2 += "ORDER BY LTRIM(REPLACE(REPLACE(REPLACE(HRMTRAININGJOURNALTRANS.PayNameFull, 'น.ส.', ''), 'นาย', ''), 'นาง', ''))"

  try {
    await pool.connect()
    let result = await pool.request()
    result = await result.input('journalId', sql.NVarChar(), journalId)
    result = await result.input('today', sql.Date(), new Date())
    result = await result.query(cmd)

    const rows = result.rowsAffected
    let data = result.recordset

    //

    let result2 = await pool.request()
    result2 = await result2.input('journalId', sql.NVarChar(), journalId)
    result2 = await result2.input('today', sql.Date(), new Date())
    result2 = await result2.query(cmd2)

    const rows2 = result2.rowsAffected
    let data2 = result2.recordset

    data2.map(item => {
      item.DepartmentId = '00000000'
      item.Department = '-- ไม่มีแผนก --'
    })

    // console.log('data: ', data)
    // console.log('rows: ', rows[0])
    // console.log('data2: ', data2)
    // console.log('rows2: ', rows2[0])

    let newRows = []
    let newData = [...data, ...data2]
    newRows[0] = rows[0] + rows2[0]

    // console.log('new data: ')
    // console.table(newData)
    //console.log('new rows: ', newRows)

    res.json({
      message: 'ดึงข้อมูลสำเร็จ',
      rows: newRows,
      data: newData
    })
  } catch (err) {
    database.handlerSqlError(res, err)
  } finally {
    pool.close()
  }
}
