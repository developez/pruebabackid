const axios = require('axios');

test('testing api /weather', () => {

    var lat = 39.719444;
    var lon = 4.520000;

    axios.get(`http://localhost:3000/weather?lat=${lat}&lon=${lon}`)
    .then(function (response) {

        expect(response.success && response.hourly && response.daily).toBe(true);

    })
    .catch(function (error) {

        expect(response.success && false).toBe(true);

    });
  
});