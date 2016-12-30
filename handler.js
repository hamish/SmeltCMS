'use strict';
const shortid = require('shortid');
const AWS = require('aws-sdk');  
const _ = require('lodash');
const fs = require('fs');

// const _ = require("underscore");

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({region:'ap-southeast-2'});

function getBody(message, event){
    var event_json = JSON.stringify(event, null, 2);

    // var template =  "<%= message %> <hr>"+
    // "<a href=''>Home</a> "+
    // "<a href='generate'>Generate</a> "+
    // "<a href='list'>List</a> "+
    // "<a href='new'>New</a> "+
    // "<a href='testRedirect'>testRedirect</a> "+
    // "<a href='http://smelt-dev-public.s3-website-ap-southeast-2.amazonaws.com/'>Static Site</a> "+
    // "<hr>Lambda called with event values: <pre><%= event_json %></pre>";

    var template = fs.readFileSync("templates/home.html", "utf8");
    
    var compiled = _.template(template);
    var body = compiled({message: message, event_json:event_json});
    return body;

}
function getDynamoSmeltItem(id, type, slug, text){
  
  var o = {
    ItemId: {"S": String(id)},
    Type: {"S": String(type)},
    Slug: {"S": String(slug)},
    Text: {"S": String(text) }
  };
  return o;
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
    var id = String(shortid.generate());
    var item = getDynamoSmeltItem(id, "Page", "/page/"+ id, "Hi there");
    db.putItem({
      TableName: "Items",
      Item: item
    }, function (err, data){
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response

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
          var item = data.Items[i];
          l = l +"<li>" + item.ItemId + " - " +item.Slug+ " - " + item.Type + "</li>";
         }
      l = l + "</ul>";
      response.body= getBody(l, event);
      return callback(null, response)
    });

  } else if (event.path === "/smelt/generate"){
    var params = {
        TableName: "Items"
    };

    docClient.scan(params, function(err, data){

      if (err) {
        response.body = getBody("<h1>Error</h1>", event);
        callback(null, response);
      }      
      var l = "<h1>Generated Page</h1> Values: <table>";
      l=l+"<th><td>ItemId</td><td>Slug</td><td>Type</td><td>Text</td></th>";
      for(var i = 0; i < data.Items.length; i++){
          var item = data.Items[i];
          l = l +"<tr><td>" + item.ItemId + "</td><td>" +item.Slug + "</td><td>" + item.Type + "</td><td>" + item.Text + "</td></tr>";
         }
      l = l + "</table>";
      var body= getBody(l, event);
      var now = new Date();
      var jsonDate = String(now.toJSON());        
      body = body + "<hr>Static File: <br>Generated at " + jsonDate;
      var file_key = encodeURIComponent("index.html");
      var params = {
        Bucket: 'smelt-dev-public', /* required */
        Key: file_key, /* required */
        ACL: 'public-read',
        Body: body,
        StorageClass: 'STANDARD',
        ContentType: "text/html"
      };
      s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response

        const response = {
          statusCode: 302,
          headers: {
            "Location": "list"
          },
          body: ""
        };
        return callback(null, response);
      }); 
    });
  } else {
    response.body = getBody("<h1>Unexpected path</h1>" + event.path, event);
    return callback(null, response);
}
};
