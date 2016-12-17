'use strict';
const AWS = require('aws-sdk');  
var s3 = new AWS.S3({region:'ap-southeast-2'});

module.exports.handler = (event, context, callback) => {
  const response = {
    statusCode: 302,
    headers: {
      "Location": "list"
    },
    body: ""
  };

    var now = new Date();
    var jsonDate = String(now.toJSON());

    var file_key = encodeURIComponent("index.html");
    var params = {
      Bucket: 'smelt-dev-public', /* required */
      Key: file_key, /* required */
      ACL: 'public-read',
      Body: 'This is a file in S3. Generated ' + jsonDate,
      StorageClass: 'STANDARD',
      ContentType: "text/html"
    };

    s3.putObject(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response

      return callback(null, response);
    });  

  
};