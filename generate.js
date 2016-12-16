'use strict';

module.exports.handler = (event, context, callback) => {
  const response = {
    statusCode: 302,
    headers: {
      "Location": "list"
    },
    body: ""
  };

  callback(null, response);
};