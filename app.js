var http = require ('http');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var app = express();

let sensornodeclients = [];
var db = mysql.createConnection({
  host: 'db-01.soe.ucsc.edu',
  user: 'arboretum_data',
  password: 'icherdak_backend',
  database: 'arboretum_data'
});

db.connect(function(err) {
  if (err) throw err;
  console.log("connected to DB");
});


var sensorindex = [];
var sensorname = [];
var sensorserialtype = [];
var sensorreading = [];
var sensortimestamp = [];
var sensoramountforclient = [];
var clientindex = 0;
var syncflag = 0;
var myflag = 1;
for (var i = 0; i < 5; i++) {
  sensorindex[i] = [];
  sensorname[i] = [];
  sensorserialtype[i] = [];
  sensorreading[i] = [];
  sensortimestamp[i] = [];
  sensoramountforclient[i] = [];
}
app.set('view engine', 'ejs');


app.get('/sensordata', (req,res) => {
  clientindex = 0;
  var waitfori = 0;
  var failquerytable = 0;
  var prevvaluefail = 0;
  let sql1 = 'SELECT * FROM sensornode_clients';
  db.query(sql1, (err, result) =>{
    if(err) throw err;
    console.log(result);
    var names = [];
    var locations = [];
    var ports = [];

    //copy all sensornode clients
    for(var k = 0; k < result.length; k++){
      console.log(k);
      sensornodeclients[k] = result[k].Name;
    }
    console.log("clients");
    console.log(sensornodeclients);
    console.log("clients.length");
    console.log(sensornodeclients.length);

    for(var i = 0; i < sensornodeclients.length; i++){
      if(i == 0) syncflag = 1;
      console.log(waitfori);
      console.log(i);
      console.log(sensornodeclients[i]);
      var currentclient = sensornodeclients[i];
      console.log(currentclient);
      let sql2 = "SELECT * FROM "+ currentclient + "";
      console.log(sql2);
        db.query(sql2, (err,result2) => {
          prevvaluefail = failquerytable;
          if(err) {
            failquerytable++;
          }
          console.log(result2);
          var countsensors = 0;
        //make sure all sensor rows have been quried and logged before incrementing waitfori
        if(failquerytable == prevvaluefail){
          for(var j = 0; j < result2.length; j++){
            if(j + 1 == result2.length){
              waitfori++; 
            } 
            countsensors++;
            sensorindex[clientindex][j] = result2[j].SensorIndex;
            sensorname[clientindex][j] = result2[j].SensorName;
            sensorserialtype[clientindex][j] = result2[j].SerialType;
            sensorreading[clientindex][j] = result2[j].Reading;
            sensortimestamp[clientindex][j] = result2[j].TimeStamp;
          }
          sensoramountforclient[clientindex][0] = countsensors;
          clientindex++;
        }
        console.log(waitfori);
        if(waitfori + failquerytable == sensornodeclients.length){
          console.log("here");
          console.log(sensornodeclients);
          console.log("here");
          console.log(sensoramountforclient);
          console.log("here");
          console.log(clientindex);
          res.render('home', {numclients: clientindex,
            snname: sensornodeclients,
            sindex: sensorindex,
            sname: sensorname,
            sstype: sensorserialtype,
            sreading: sensorreading,
            stimestamp: sensortimestamp,
            samountperclient: sensoramountforclient});
        }  
      });
    }
  });
});

var pingnames = [];
var pingsec = [];
var pingmin = [];
var pinghours = [];
var pingdays = [];
var pingmonths = [];
app.get('/schedulingpage', function(req,res){
  var pingclientamount = 0;
  let sql1 = 'SELECT * FROM sensornode_clients';
  db.query(sql1, (err, result) =>{
    if(err) throw err;
    console.log(result);
    var clientamount = result.length;
    // var sensornodeclients[];
    var names = [];
    var locations = [];
    var ports = [];
    var maxidpername = [];
    
    for(var i = 0; i < result.length; i++){
      names[i] = result[i].Name;
      locations[i] = result[i].Location;
      ports[i] = result[i].Port;
      maxidpername[i] = 0;
      console.log(names[i]);
    }
    var waitforquerybeforerendering = 0;
    for(var i = 0; i < names.length; i++){
      let sql3 = "SELECT max(id) AS ID FROM pingtiming WHERE sensornodename = '"+ names[i] +"'";
      db.query(sql3, (err, result1) =>{
        if(err) throw err;
        console.log(result1);
        console.log(result1[0].ID);
        maxidpername[i] = result1[0].ID; 
        let sql2 = "SELECT * FROM pingtiming WHERE id = '"+ maxidpername[i] +"'";
        db.query(sql2, (err, result) =>{
          if(err) throw err;
          console.log(result);
          console.log("length");
          console.log(result.length);
          if(result.length >= 0){
            pingnames[pingclientamount] = result[0].sensornodename;
            pingsec[pingclientamount] = result[0].sec;
            pingmin[pingclientamount] = result[0].min;
            pinghours[pingclientamount] = result[0].hours;
            pingdays[pingclientamount] = result[0].days;
            pingmonths[pingclientamount] = result[0].months;
            pingclientamount++;
          } else {
            waitforquerybeforerendering++;
          }

          console.log(pingnames);
          console.log(pingclientamount);
          console.log("here1");
          console.log(pingclientamount,pingnames,pingsec,pingmin,pinghours,pingdays,pingmonths);
          if(i == names.length && waitforquerybeforerendering + pingclientamount == names.length){
            res.render('schedulingpage',{clength: clientamount,
             cnames: names,                     
             clocations: locations,
             cports: ports,
             plength: pingclientamount,
             pnames: pingnames,
             psec: pingsec,
             pmin: pingmin,
             phours: pinghours,
             pdays: pingdays,
             pmonths: pingmonths});
          }
        });
      });  
    }

    console.log(pingclientamount,pingnames,pingsec,pingmin,pinghours,pingdays,pingmonths);

  });
});

app.post('/schedulingpage', urlencodedParser, function(req,res){
  console.log(req.body);
  console.log(req.body.seconds);
  console.log(req.body.sensornodename);
  console.log(req.body.minutes);
  let shit = req.body.seconds;

  //make sure the user filled out every field
  if(req.body.sensornodename === '') req.body.sensornodename = "emptynameentered";
  if(req.body.seconds === '' || req.body.seconds == null) req.body.seconds = "0"; 
  if(req.body.minutes === '' || req.body.minutes == null) req.body.minutes = "0"; 
  if(req.body.hours === '' || req.body.hours == null) req.body.hours = "0"; 
  if(req.body.days === '' || req.body.days == null) req.body.days = "0"; 
  if(req.body.months === '' || req.body.months == null) req.body.months = "0"; 
  let sql = "INSERT INTO pingtiming (sensornodename,sec,min,hours,days,months) VALUES \
  ('" + req.body.sensornodename + "' , " + req.body.seconds +" \
  ," + req.body.minutes +" , "+ req.body.hours +" , "+ req.body.days +" , "+ req.body.months +" )";
  db.query(sql, (err, result) =>{
    if(err) throw err;
    console.log(result);
  });
  res.render('pingsubmitsuccess', {data:req.body});
});

app.listen(5000);
