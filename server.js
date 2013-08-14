var expect = require('chai').expect,
    mysql = require('mysql2'),
    levelup = require('levelup'),
    rimraf = require('rimraf'),
    levelQuery = require('level-queryengine'),
    sqlDriver = require('./lib/sql-driver'),
    jsonqueryEngine = require('jsonquery-engine'),
    path = require('path');

var testData, db, dbPath = path.join(__dirname, 'data', 'testdb');
rimraf.sync(dbPath);
db = levelup(dbPath, { valueEncoding: 'json' });
db = levelQuery(db);
testData = require('./data.json');

function batchData() {
  return testData.map(function (data, i) {
    return { key: i, value: data, type: 'put' };
  });
}

var port = process.env.PORT || process.argv[2] || 3307;
var server;
var users = levelQuery(db.sublevel('users'));
users.query.use(jsonqueryEngine());
users.batch(batchData(), function () {
  server = sqlDriver(db, port);
  console.log('MySQL Server Listening on Port ' + port);
});
