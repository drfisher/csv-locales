var chai = require('chai');
var csvLocales = require('../lib');
var fs = require('fs-extra');
var path = require('path');

var testParams = {
  csvPath: 'locales.csv',
  dist: '../tmp/_locales',
  debug: true
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
      fs.removeSync(testParams.dist);
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

  // Make absolute paths in testParams
  before(function () {
    var dir = __dirname + path.sep;
    ['csvPath', 'dist'].forEach(function (curPath) {
      testParams[curPath] = path.normalize(dir + testParams[curPath]);
    });
  });

  it('should work without errors', function () {
    return createLocales(testParams);
  });

  // Clear after tests
  after(function () {
    clearLocales();
  });
});
