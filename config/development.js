module.exports = {
  mssql: {
    user: 'sa',
    password: 'IT@sql2008',
    server: '172.18.3.11',
    database: 'EPPAX4BSCDEV',
    options: {
      encrypt: false
    },
    pool: {
      max: 100,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
  soap: {
    url: 'http://172.18.2.129:91/DynamicsAXService.asmx?wsdl',
    user: 'eppadmin',
    pass: 'IT@dm187',
    className: 'dotnetTraining'
  },
  hr: {
    costcenter: '50690019'
  }
}
