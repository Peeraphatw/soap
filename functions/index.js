const soap = require('soap');
const config = require('../config');

exports.callSoapApi = (methodName) => {
  let args = {};
  const { user, pass, className, url } = config.soap;

  args = {
    user,
    pass,
    className,
    methodName,
    param1: 'hello',
  };

  //   console.log('Args: ')
  // console.dir(args)

  return new Promise((resolve, reject) => {
    soap.createClient(url, (err, client) => {
      if (err) return reject('Can Not Connect SOAP API');

      client.CallStaticClassMethod2(args, (err, soapResult) => {
        if (err) return reject('Can Not Call Static Class');

        return resolve(soapResult.CallStaticClassMethod2Result);
      });
    });
  });
};
