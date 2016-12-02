'use strict';
const shortid = require('shortid');
const AWS = require('aws-sdk');  
var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function getBody(message, event){
    var body = message + " <hr>"+
    "<a href=''>Home</a> "+
    "<a href='list'>List</a> "+
    "<a href='new'>New</a> "+
    "<a href='testRedirect'>testRedirect</a> "+
    "<hr>Lambda called with event values: <pre>" +JSON.stringify(event, null, 2) + "</pre>";
    return body;
}

module.exports.smelt = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  };

  if (event.path === "/smelt/" || event.path === "/smelt" ){
    response.body = getBody("<h1>Home Page</h1>", event);
    return callback(null, response);
  } else if (event.path === "/smelt/new"){

    var id = shortid.generate();
    var model = {
      ItemId: {"S" : ""},
    };
    model.ItemId.S=String(id);
    db.putItem({
      TableName: "Items",
      Item: model
    }, function (err, data){
      response.body = getBody("<h1>New Item Saved</h1>" + id, event);
      return callback(null, response);
    });

  } else if (event.path === "/smelt/list"){
    var params = {
        TableName: "Items"
    };

    docClient.scan(params, function(err, data){

      if (err) {
        response.body = getBody("<h1>Error</h1>", event);
        callback(null, response);
      }      
      var l = "<h1>List</h1> Values: <ul>"
      for(var i = 0; i < data.Items.length; i++){
           l = l +"<li>" + data.Items[i].ItemId + "</li>";
         }
      l = l + "</ul>";
      response.body= getBody(l, event);
      return callback(null, response)
    });
  } else {
    response.body = getBody("<h1>Unexpected path</h1>" + event.path, event);
    return callback(null, response);

  }
};


