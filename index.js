const axios = require('axios');

const express = require('express');
const app = express();
const port = 3000;;

var MongoClient = require('mongodb').MongoClient;
var db = null;

const DB_NAME = "test_weather";
const CS = "mongodb://localhost:27017/weather_test?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const api_key = "a53f9dc7d1ee9862a5fac589bd8eb46f";

function diff_seconds(date1, date2)
{
    var diff = Math.abs(date2.getTime() - date1.getTime());

    var seconds = Math.floor((diff/1000));

    return seconds;
}

function build_output(timestamp, response)
{
    return {
        success: true,
        data: {
            timestamp: timestamp,
            hourly: response.data.hourly,
            daily: response.data.daily
        }
    }
}

app.get('/weather', (req, res) => {

    console.log("<= " + "/weather ...");

    // validations ...
    var lat = parseFloat(req.query.lat);
    var lon = parseFloat(req.query.lon);

    if(isNaN(lat) || isNaN(lon) || lat == null || lon == null)
    {
        var output = {
            success: false,
            error: "lat and lon is needed"
        }
        res.send(output); 
        return;        
    }

    db.collection("weather_cache").findOne({ lat: lat, lon: lon })
    .then(result => {

        // return cache data if less than 3 hours
        if(result == null || diff_seconds(new Date(), result.timestamp) > 60*60*3)
        {
            axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude={part}&appid=${api_key}`)
            .then(function (response) {

                var timestamp = new Date();
                db.collection("weather_cache").updateOne({ lat: lat, lon: lon }, { $set: { timestamp: timestamp, data: response.data } }, { upsert: true }, 
                function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                });        

                var output = build_output(timestamp, response);
                res.send(output);       

                console.log("=> " + JSON.stringify(output));

            })
            .catch(function (error) {

                var output = {
                    success: false,
                    error: "third party server error"
                }
                res.send(output);    

                console.log(error);        

            });

        }
        else
        {
            var output = build_output(result.timestamp, result);
            res.send(output);       

            console.log("=> " + JSON.stringify(output));
        }
    })
    .catch(error => {

        var output = {
            success: false,
            error: "database error"
        }
        res.send(output);    

        console.log(error);  

    });

})

app.listen(port, () => {

    console.log(`Listening at http://localhost:${port}`)

    MongoClient.connect(CS, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        db = client.db(DB_NAME);
        console.log("Connected to `" + DB_NAME + "`!");
    });

})