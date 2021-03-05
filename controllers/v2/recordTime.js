const sql = require('mssql')
const fs = require("fs")
const soap = require("soap")
const database = require('../../database')

const config = require('../../config')

//แก้ไข
//ext บันทึกข้อมูลก่อน ค่อย save ลายเซ็นต์
//in save ลายเซ็นต์ ก่อน

module.exports = {
    recordTime: async (req, res) => {
        const { empId, signature, journalId } = req.body

        if (!empId || !signature || !journalId) {
            return res.status(400).json({message: 'ป้อนข้อมูลมาไม่ครบ'})
        }

        try {
            
            const dirPath = await getSignaturePath(res)
            console.log('dirPath: ', dirPath)
            const saveSign = await saveSignature(empId.toUpperCase(), journalId, signature, dirPath)
            console.log('saveSignature: ', saveSign)
            const result = await recordTime(res, empId, journalId)
            console.log('result: ', result)

            res.status(201).json(result)

        } catch (err) {
            console.log(err.err, err.code)
            res.status(err.code).json(err.err)
        }
    },
    recordTimeWalkIn: async (req, res) => {
        const { empId, signature, journalId, company, name, walkInType } = req.body

        if(!walkInType || !journalId || !signature) {
            return res.status(400).json({message: 'มีข้อมูลสูญหาย'})
        }

        const dirPath = await getSignaturePath(res)
        console.log('dirPath: ', dirPath)

        // 1 = มีรหัสพนักงาน
        if(walkInType === '1') {
            if(!empId) {
                return res.status(400).json({message: 'มีข้อมูลสูญหาย'})
            }

            try {

                const saveSign = await saveSignature(empId.toUpperCase(), journalId, signature, dirPath)
                console.log('saveSignature: ', saveSign)
                const result = await recordTime(res, empId, journalId)
                console.log('result: ', result)

                res.status(201).json(result)  

            } catch (err) {
                console.log(err.err, err.code)
                res.status(err.code).json(err.err)
            }  
            
        } else {
            if(!name || !company) {
                return res.status(400).json({message: 'มีข้อมูลสูญหาย'})
            }

            try {
                
                const result = await recordTimeWalkInExt(journalId, name, company)
                console.log('result: ', result)
                const saveSign = await saveSignatureWalkIn(result.result, journalId, signature, dirPath)
                console.log('saveSignature: ', saveSign)

                res.status(201).json(result)  

            } catch (err) {
                console.log(err.err, err.code)
                res.status(err.code).json(err.err)
            }
        }
    }
}

// บันทึกลายเซ็นต์
saveSignature = (empId, journalId, signature, dirPath) => {
    return new Promise((resolve, reject) => {
        const imageType = '.jpg'
        const hours = new Date().getHours()
        let date = new Date().getDate();
        let month = new Date().getMonth() + 1
        let year = new Date().getFullYear()
    
        date = (date < 10) ? `0${date}` : date
        month = (month < 10) ? `0${month}` : month
        const time = (hours < 12) ? 'A' : 'P'
    
        // \\EPI-FILESHARE\EPGSignature$\EmpId-JournalId-dd-mm-yyyy-A.jpg
        const path = `${dirPath}${empId}-${journalId}-${date}${month}${year}-${time}${imageType}`
        const base64Data = signature.replace(/^data:image\/png;base64,/, '')
    
        try {
            if (fs.existsSync(path)) {
                //success
                return resolve(`path is exists. ${path}`)
            } 

            fs.writeFile(path, base64Data, 'base64', err => {
                if (err) return reject(
                    {
                        err: {
                            message: `cannot save signature. ${err}`
                        },
                        code: 500
                    }
                )

                //success
                resolve(`saved signature at ${path}`)
            })
        } catch (err) {
            reject(
                {
                    err: {
                        message: `cannot save signature. ${err}`
                    },
                    code: 500
                }
            )
        }
    })
}

// บันทึกลายเซ็นต์ (ภายนอก ไม่มีรหัสพนักงาน)
saveSignatureWalkIn = (empId, journalId, signature, dirPath) => {
    return new Promise((resolve, reject) => {
        const imageType = '.jpg'
        const hours = new Date().getHours()
        let date = new Date().getDate();
        let month = new Date().getMonth() + 1
        let year = new Date().getFullYear()
    
        date = (date < 10) ? `0${date}` : date
        month = (month < 10) ? `0${month}` : month
        const time = (hours < 12) ? 'A' : 'P'
    
        // \\EPI-FILESHARE\EPGSignature$\EmpId-JournalId-dd-mm-yyyy-A.jpg
        const path = `${dirPath}${empId}-${journalId}-${date}${month}${year}-${time}${imageType}`
        const base64Data = signature.replace(/^data:image\/png;base64,/, '')
    
        try {
            if (fs.existsSync(path)) {
                //success
                return resolve(
                    {
                        result: 'succeed',
                        message: `saved signature at ${path}`
                    }
                )
            }

            fs.writeFile(path, base64Data, 'base64', err => {
                if (err) return reject(
                    {
                        err: {
                            message: `cannot save signature. ${err}`
                        },
                        code: 500
                    }
                )

                //success
                resolve(
                    {
                        result: 'succeed',
                        message: `saved signature at ${path}`
                    }
                ) 
            })
        } catch (err) {
            reject(
                {
                    err: {
                        message: `cannot save signature. ${err}`
                    },
                    code: 500
                }
            )
        }
    })
}

recordTime = (res, empId, journalId) => {
    return new Promise(async (resolve, reject) => {
        let pool = database.connect()
        database.handlePoolError(res, pool)
    
        try {
            let cmd = "SELECT JournalId, Description, StartDate, EndDate "
            cmd += "FROM HRMTRAININGJOURNALTABLE WHERE JournalId = @journalId "
            cmd += "AND @today BETWEEN StartDate AND EndDate"
    
            await pool.connect()
            let result = await pool.request()
            result = await result.input("journalId", sql.NVarChar(), journalId)
            result = await result.input("today", sql.Date(), new Date())
            result = await result.query(cmd)
    
            // เช็ควันที่ลงทะเบียน ไม่ให้ลงย้อนหลังหรือล่วงหน้าได้
            if (result.rowsAffected == 0) {
                return reject(
                    {
                        err: {
                            message: 'cannot recordtime, today is not between start date and end date of this journal',
                            result: 'not register'
                        }, 
                        code: 200
                    }
                )
            }
    
            //ORDER BY Learn DESC, HRLearn DESC
            //แก้บัค ถ้ามีชื่อมากกว่า 1 line
            const cmdAM = "SELECT LEARN AS AM FROM HRMTRAININGJOURNALTRANS WHERE PERSONNUMBER = @empId AND JOURNALID = @journalId AND STARTDATE = @today AND ENDDATE = @today ORDER BY Learn DESC, HRLearn DESC"
            const cmdPM = "SELECT HRLEARN AS PM FROM HRMTRAININGJOURNALTRANS WHERE PERSONNUMBER = @empId AND JOURNALID = @journalId AND STARTDATE = @today AND ENDDATE = @today ORDER BY Learn DESC, HRLearn DESC"
    
            const hours = new Date().getHours()
            let cmd2 = (hours < 12) ? cmdAM : cmdPM
    
            let result2 = await pool.request()
            result2 = await result2.input("empId", sql.NVarChar(), empId)
            result2 = await result2.input("journalId", sql.NVarChar(), journalId)
            result2 = await result2.input("today", sql.Date(), new Date())
            result2 = await result2.query(cmd2)
    
            // console.log(result2.rowsAffected)
            // console.log(result2.recordset[0])
    
            // เช็คประวัติการเข้าอบรม
            if (result2.rowsAffected > 0 && (result2.recordset[0].AM == 1 || result2.recordset[0].PM == 1)) {
                return reject(
                    {
                        err: {
                            message: 'you have already trained this course.',
                            result: 'trained'
                        },
                        code: 200
                    }
                )
            }
    
            let args = {};
            let methodName = "recordTime"
    
            if (result2.rowsAffected == 0)
                methodName = "recordTime_WalkInEmpl"
    
            const { user, pass, className, url } = config.soap
    
            args = {
                user,
                pass,
                className,
                methodName,
                param1: journalId,
                param2: empId,
                param3: ''
            };
    
            console.log('Args: ')
            console.dir(args)
    
            soap.createClient(url, (err, client) => {
                if (err) {
                    console.log('Can Not Connect SOAP API')
                    return reject(
                        {
                            err: { message: 'Can Not Connect SOAP API' },
                            code: 500
                        }
                    )
                }
                    
                client.CallStaticClassMethod5(args, (err, soapResult) => {
                    if (err) {
                        console.log('Can Not Call Static Class')
                        return reject(
                            {
                                err: { message: 'Can Not Call Static Class' },
                                code: 500
                            }
                        )
                    }
    
                    // รับค่า return มาจาก BSC
                    const result3 = soapResult.CallStaticClassMethod5Result
                    console.log('soapResult: ', result3)
    
                    switch (result3) {
                        case "succeed":
                            return resolve({
                                message: 'record time, succeed.',
                                result: result3
                            })
                        case "failed":
                            return reject(
                                {
                                    err: {
                                        message: 'record time, failed.',
                                        result: result3
                                    }, 
                                    code: 200
                                }
                            )
                        case "null":
                            return reject(
                                {
                                    err: {
                                        message: 'record time, lose data.',
                                        result: result3
                                    }, 
                                    code: 400
                                }
                            )
                        default:
                            return reject(
                                {
                                    err: {
                                        message: 'record time, erorr.',
                                        result: result3
                                    }, 
                                    code: 500
                                }
                            )
                    }
    
                })
    
            })
        } catch (err) {
            database.handlerSqlError(res, err)
        } finally {
            pool.close();
        }
    })
}

// บันทึกเวลาอบรม (ภายนอก ไม่มีรหัสพนักงาน) 
recordTimeWalkInExt = (journalId, name, company) => {
    return new Promise((resolve, reject) => {
        console.log('recordTimeWalkInExt')
        let args = {}
        let methodName = "recordTime_WalkInExt"
        const { user, pass, className, url } = config.soap

        args = {
            user,
            pass,
            className,
            methodName,
            param1: journalId,
            param2: name,
            param3: company.toUpperCase()
        };

        console.log('Args: ')
        console.dir(args)

        soap.createClient(url, (err, client) => {
            if (err) {
                return reject(
                    {
                        err: { message: 'Can Not Connect SOAP API' },
                        code: 500
                    }
                )
            }
                
            client.CallStaticClassMethod5(args, (err, soapResult) => {
                if (err) {
                    return reject(
                        {
                            err: { message: 'Can Not Call Static Class' },
                            code: 500
                        }
                    )
                }

                // รับค่า return มาจาก BSC
                const result = soapResult.CallStaticClassMethod5Result
                console.log('soapResult: ', result)

                switch (result) {
                    case "failed":
                        return reject(
                            {
                                err: {
                                    message: 'record time, failed.',
                                    result
                                },
                                code: 200
                            }
                        )
                    case "null":
                        return reject(
                            {
                                err: {
                                    message: 'record time, lose data.',
                                    result
                                },
                                code: 200
                            }
                        )
                    case "": 
                        return reject(
                            {
                                err: {
                                    message: 'record time, erorr.',
                                    result
                                },
                                code: 200
                            }
                        )
                    default: // บันทีกเวลาสำเร็จ
                        return resolve({
                            message: 'record time, succeed.',
                            result
                        })
                }
            })
        })
    })
}

// ดึง path signature 
getSignaturePath = async (res) => {
    let pool = database.connect()
    database.handlePoolError(res, pool)

    try {
        let cmd = "SELECT SingnaturePath FROM HRMTrainingParameters"

        await pool.connect()
        let result = await pool.request()
        result = await result.query(cmd)

        const dirPath = result.recordset[0].SingnaturePath
        
        return dirPath

    } catch (err) {
        database.handlerSqlError(res, err)
    } finally {
        pool.close()
    }  
}