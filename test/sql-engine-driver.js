var expect = require('chai').expect,
    mysql = require('mysql2'),
    levelup = require('levelup'),
    rimraf = require('rimraf'),
    levelQuery = require('level-queryengine'),
    sqlDriver = require('../lib/sql-driver'),
    jsonqueryEngine = require('jsonquery-engine'),
    path = require('path');

describe('json query driver', function() {
  var testData, db, dbPath = path.join(__dirname, '..', 'data', 'testdb');

  function batchData() {
    return testData.map(function (data, i) {
      return {
        key: i,
        value: data,
        type: 'put'
      };
    });
  }

  beforeEach(function(done) {
    rimraf.sync(dbPath);
    db = levelup(dbPath, { valueEncoding: 'json' });
    db = levelQuery(db);
    testData = [
      { name: 'Eugene', num: 42 },
      { name: 'Susan', num: 43 },
      { name: 'Edmund', num: 88 }
    ];
    done();
  });

  afterEach(function(done) {
    db.close(done);
  });

  it('should be able to proxy a simple request', function(done) {
    var server;
    var users = levelQuery(db.sublevel('users'));
    users.query.use(jsonqueryEngine());
    users.batch(batchData(), launchServer);

    function launchServer() {
      server = sqlDriver(db, 3307, undefined, undefined, doQuery);
    }

    function doQuery() {
      var clientConn = mysql.createConnection({
        user: 'root',
        database: 'triggertest',
        host:'localhost',
        password: 'iluvhslim2',
        port: 3307
      });

      clientConn.query('SELECT * FROM users WHERE num = 88',
        function (err, rows, fields) {
          if (err) return done(err);
          console.log(rows);
          server._server.close();
          done();
        });
    }
  });
});
