var assert = require('chai').assert;
var csvLocales = require('../lib');
var fs = require('fs-extra');
var path = require('path');
var iterator = require('object-recursive-iterator');
var getByPath = require('getbypath');

var localeParams = {
  csvPath: 'locales.csv',
  dirPath: '../tmp/_locales',
  debug: false
};

var testParams = {
  locales: ['ru', 'en'],
  // jscs:disable
  examples: {
    en: {
      ext_name: {
        message: 'My localized extension',
        description: 'The title of the extension'
      },
      ext_discription: {
        message: 'This is an example of extension\'s short description',
        description: 'The description of the extension'
      },
      options_title: {
        message: 'Options for $option$',
        description: 'Options for a subject which mentioned in the $optionName$',
        placeholders: {
          optionName: {
            content: '$1'
          },
          extraData: {
            content: '$2'
          }
        }
      }
    },
    ru: {
      ext_name: {
        message: 'Мое локализованное расширение',
        description: 'Название расширения'
      },
      ext_discription: {
        message: 'Это пример краткого описания расширения',
        description: ''
      },
      options_title: {
        message: 'Настройка $option$$extraData$',
        description: 'Настройка переданного в $optionName$ параметра',
        placeholders: {
          optionName: {
            content: '$1'
          },
          extraData: {
            content: '$2'
          }
        }
      }
    }
  }
  // jscs:enable
};

/**
 * Creates locales
 * @param {object} params  Locales creation params
 * @returns {Promise}
 */
function createLocales (params) {
  return new Promise(function (resolve, reject) {
    csvLocales(params, function (err) {
      if (err) {
        throw err;
      }
      resolve();
    });
  });
}

/**
 * Clear locales
 * @returns {Promise}
 */
function clearLocales () {
  return new Promise(function (resolve, reject) {
    try {
      fs.removeSync(localeParams.dirPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/*
 * Tests
 */
describe('csv-locales', function () {
  var messages = {};
  var localesTotal = testParams.locales.length;

  // Make absolute paths in testParams
  before(function () {
    var dir = __dirname + path.sep;
    ['csvPath', 'dirPath'].forEach(function (curPath) {
      localeParams[curPath] = path.normalize(dir + localeParams[curPath]);
    });
  });

  it('should works without errors', function () {
    return createLocales(localeParams);
  });

  it('should creates ' + localesTotal + ' locales',
    function () {
      var count = 0;
      testParams.locales.every(function (localeName) {
        try {
          var jsonPath = path.normalize([
            localeParams.dirPath, localeName, 'messages.json'
          ].join(path.sep));
          var json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

          assert.typeOf(json, 'object');
          messages[localeName] = json;
          count++;
          return true;

        } catch (err) {
          return false;
        }
      });
      assert.equal(count, localesTotal);
    });

  it('should creates json with a valid structure', function () {
    testParams.locales.forEach(function (localeName) {
      iterator.forAll(messages[localeName], function (path, key, obj) {
        if (typeof obj[key] === 'string') {
          path = path.concat(key).join('.');
          assert.equal(
            obj[key],
            getByPath(testParams.examples[localeName], path)
          );
        }
      });
    });
  });

  // Clear after tests
  after(function () {
    clearLocales();
  });
});
