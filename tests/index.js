var path = require('path');
var createLocales = require('../lib');

var params = {
  csvPath: __dirname + path.sep + '../locales.csv'
};

createLocales(params, function (err, json) {
  if (err) {
    throw err;
  }
  console.log('Type of json is %s', typeof json);
  console.log(json);
});
