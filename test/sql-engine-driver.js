var expect = require('chai').expect,
    mysql = require('mysql2'),
    mysql_ = require('mysql'),
    levelup = require('levelup'),
    rimraf = require('rimraf'),
    through = require('through'),
    levelQuery = require('level-queryengine'),
    sqlDriver = require('../lib/sql-driver'),
    jsonqueryEngine = require('jsonquery-engine'),
    jsonTestData = require('json-testdata'),
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
      { name: 'Eugene', num: 42, awesome: 'goodbye', x: 99 },
      { name: 'Susan', num: 43, awesome: 'blah' },
      { name: 'Edmund', num: 88, awesome: true, car: { make: 'Toyota', model: 'Corolla' } }
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

      clientConn.query('SELECT * FROM users',
        function (err, rows, fields) {
          if (err) return done(err);
          console.log(rows);
          server._server.close();
          done();
        });
    }
  });

  it('should be able to specify columns', function(done) {
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

      clientConn.query('select name, num from users',
        function (err, rows, fields) {
          if (err) return done(err);
          console.log(rows);
          server._server.close();
          done();
        });
    }
  });

  it('should be able to query an irregular json database', function(done) {
    var server;
    var users = levelQuery(db.sublevel('packages'));
    users.query.use(jsonqueryEngine());
    users.batch(jsonTestData.leveldata, launchServer);

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

      clientConn.query('select * from packages where author = "TJ Holowaychuk <tj@vision-media.ca>"',
        function (err, rows, fields) {
          if (err) return done(err);
          console.log(rows);
          server._server.close();
          done();
        });
    }
  });
});
