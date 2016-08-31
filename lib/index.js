var fs = require('fs-extra');
var path = require('path');
var csvParse = require('csv-parse');
var getByPath = require('getbypath');
var extendObj = require('extend-object');
var UNSAFE_SYMBOLS = [
  {
    pattern: / \n/g,
    replace: ' '
  }
];

/**
 * Replaces some unsafe symbols to spaces
 * @param {string} csvContent
 * @returns {string}
 */
function processCsv (csvContent) {
  UNSAFE_SYMBOLS.forEach(function (symbolParams) {
    csvContent = csvContent.replace(symbolParams.pattern, symbolParams.replace);
  });
  return csvContent;
}

/**
 * Creates all directories and files from json
 * @param {Array} json
 * @param {object} params
 * @param {function} callback
 */
function createLocales (json, params, callback) {
  var locales = registerLocales(json.shift());
  var indexes = locales.indexes;
  var messageName;

  delete locales.indexes;

  json.forEach(function (messageLine) {
    var messageProp, lineValue, propPath;

    for (var i = 0, len = messageLine.length; i < len; i++) {
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
        if (lineValue === '' && messageProp !== 'description') {
          continue;
        }
        propPath = [
          indexes[i], 'messages', messageName
        ].join('.');
        getByPath(locales, propPath, true)[messageProp] =
          messageProp !== 'placeholders' ?
            lineValue || ''
            : parsePlaceholders(lineValue);
      }
    }
  });
  if (params.debug) {
    log('Generated locales:', locales);
  }
  writeLocales(locales, params, callback);
}

/**
 * Generates a placeholders object from a source string
 * @param {string} source
 * @returns {object}
 */
function parsePlaceholders (source) {
  return source.match(/\([^\)]+\)/g).reduce(function (result, placeholder) {
    placeholder = placeholder.replace(/^\(([^\)]+)\)$/, '$1');
    var keyValue = placeholder.split(':');
    result[keyValue[0]] = {
      content: keyValue[1]
    };
    return result;
  }, {});
}

/**
 * Writes locales to a file system
 * @param {object} locales
 * @param {object} params
 * @param {function} callback
 */
function writeLocales (locales, params, callback) {
  try {
    var jsonPath, json;
    for (var key in locales) {
      if (locales.hasOwnProperty(key)) {
        json = locales[key];
        jsonPath = path.join(params.dirPath, json.localeName, 'messages.json');

        // remove empty messages
        for (var msg_key in json.messages) {
          if (json.messages.hasOwnProperty(msg_key)) {
            if (json.messages[msg_key]['message'] == undefined) {
              delete json.messages[msg_key];
            }
          }
        }

        fs.outputJsonSync(jsonPath, json.messages);
        if (params.debug) {
          log('Created file', jsonPath, json.messages);
        }
      }
    }
    callback(null);
  } catch (err) {
    callback(err);
  }
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
 * Console logs
 */
function log () {
  var dataToLog = Array.prototype.slice.call(arguments);
  dataToLog.forEach(function (line) {
    if (typeof line === 'object') {
      line = JSON.stringify(line);
    }
    console.log(line);
  });
  console.log('\n');
}

/**
 * Checks if a path exists and transforms it to an absolute if it's relative
 * @param {string} sourcePath
 * @param {string} errorMessage
 * @returns {string}
 */
function processPath (sourcePath, errorMessage) {
  if (!sourcePath || typeof sourcePath !== 'string') {
    throw new Error(errorMessage);
  }
  if (!path.isAbsolute(sourcePath)) {
    sourcePath = path.join(process.cwd(), sourcePath);
  }
  return sourcePath;
}

/**
 * The main module's method wich creates all locales from a CSV file
 * @param {object} params
 * @param {function} callback
 */
module.exports = function (params, callback) {
  var _params = extendObj({}, params);
  var parseParams = _params.csvParse || {};

  try {
    _params.csvPath = processPath(_params.csvPath, 'csvPath is required!');
    _params.dirPath = processPath(_params.dirPath, 'dirPath is required!');
  } catch (err) {
    callback(err);
  }

  fs.readFile(_params.csvPath, 'utf8', function (err, localesCsv) {
    if (err) {
      callback(err);
    }
    csvParse(processCsv(localesCsv), parseParams, function (err, localesJson) {
      if (err) {
        callback(err);
      }
      if (_params.debug) {
        log('Parsed csv file:', localesJson);
      }
      createLocales(localesJson, _params, callback);
    });
  });
};
