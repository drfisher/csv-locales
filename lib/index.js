var fs = require('fs-extra');
var path = require('path');
var csvParse = require('csv-parse');

/**
 * Creates all directories and files from json
 * @param {object|Array} json
 * @param {object} params
 * @param {function} callback
 */
function createLocales (json, params, callback) {
  var locales = registerLocales(json.shift());
  var indexes = locales.indexes;
  var messageName;

  delete locales.indexes;

  json.forEach(function (messageLine) {
    var messageProp, lineValue;

    for (var i = 0, len = json.length; i < len; i++) {
      lineValue = messageLine[i];
      if (i === 0) {
        // The first item is a message name
        // or an empty string for a "description"
        messageName = lineValue || messageName;

      } else if (i === 1) {
        // The second is "message" or "description"
        messageProp = lineValue;

      } else {
        // All others are locales
        if (lineValue === '' && messageProp === 'message') {
          continue;
        }
        locales[indexes[i]][messageProp] = lineValue || '';
      }
    }
  });
  callback(null, locales);
}

/**
 * Creates and rerutns a nested object in a parent object
 * @param {object} parent
 * @param {string} nested
 * @returns {object}
 */
function getNested (parent, nested) {
  var result = parent[nested];
  if (!result) {
    result = parent[nested] = {};
  }
  return result;
}

/**
 * Returns an object with existed locales
 * @param {Array} headers
 * @returns {object}
 */
function registerLocales (headers) {
  var localesList = {
    indexes: {}
  };
  var i = headers.length - 1;
  var localeName;

  while (i >= 2) {
    localeName = headers[i].trim().split(/[\s\(]/)[0];
    localesList[localeName] = {
      localeName: localeName,
      messages: {}
    };
    localesList.indexes[i] = localeName;
    i--;
  }
  return localesList;
}

/**
 * The main module's method wich creates all locales from a CSV file
 * @param {object} params
 * @param {function} callback
 */
module.exports = function (params, callback) {

  var csvPath = params && params.csvPath;
  if (!csvPath) {
    callback(new Error('CSV path is required!'));
  }
  fs.readFile(path.normalize(csvPath), 'utf8', function (err, localesCsv) {
    if (err) {
      callback(err);
    }
    csvParse(localesCsv, params.csvParse || {}, function (err, localesJson) {
      if (err) {
        callback(err);
      }
      createLocales(localesJson, params, callback);
    });
  });
};
