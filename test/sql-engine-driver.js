var expect = require('chai').expect,
    sqlTransform = require('../lib/sql-transform'),
    mysql = require('mysql2'),
    levelup = require('levelup'),
    through = require('through'),
    rimraf = require('rimraf'),
    levelQuery = require('level-queryengine'),
    jsonqueryEngine = require('jsonquery-engine'),
    path = require('path');

function getColumnDefinitions(dbName, table, row) {
  var defs = [];
  Object.keys(row).forEach(function (colName) {
    var colValue = row[colName];
    defs.push(getColumnDefinition(dbName, table, colName, colValue));
  });
  return defs;
}

function getColumnDefinition(dbName, table, colName, colValue) {
  switch (typeof colValue) {
    case 'string':
      return {
        catalog: 'def',
        schema: dbName,
        table: table,
        orgTable: table,
        name: colName,
        orgName: colName,
        characterSet: 33,
        columnLength: 196605,
        columnType: 252,
        flags: 16,
        decimals: 0 };

    case 'number':
      return {
        catalog: 'def',
        schema: dbName,
        table: table,
        orgTable: table,
        name: colName,
        orgName: colName,
        characterSet: 63,
        columnLength: 22,
        columnType: 5,
        flags: 0,
        decimals: 31
      };

  case 'boolean':
    return {
      catalog: 'def',
      schema: dbName,
      table: table,
      orgTable: table,
      name: colName,
      orgName: colName,
      characterSet: 63,
      columnLength: 1,
      columnType: 1,
      flags: 0,
      decimals: 0 };
  }

  return {};
}

describe('json query driver', function() {
  var server, testData, db, dbPath = path.join(__dirname, '..', 'data', 'testdb');

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
    var users = levelQuery(db.sublevel('users'));
    users.query.use(jsonqueryEngine());

    console.log(Object.keys(users.sublevels));

    users.batch(batchData(), launchServer);

    function launchServer() {
      server = mysql.createServer();
      server.listen(3307, undefined, undefined, doQuery);
      server.on('connection', function(conn) {
        console.log('connection');

        conn.serverHandshake({
          protocolVersion: 10,
          serverVersion: 'node.js rocks',
          connectionId: 1234,
          statusFlags: 2,
          characterSet: 8,
          capabilityFlags: 0xffffff
        });

        conn.on('field_list', function(table, fields) {
          conn.writeEof();
        });

        conn.on('query', function(sql) {
          var jsq = sqlTransform(sql);
          console.log('proxying query:' + sql);
          console.log(jsq);
          var rows = [];
          users.query(jsq).pipe(through(
            function (data) {
              rows.push(data);
            },
            function () {
              if (rows.length) {
                var defs = getColumnDefinitions('levelup', 'mysub', rows[0]);
                conn.writeTextResult(rows, defs);
              } else {
                conn.writeOk(0);
              }
            }
          ));
        });
      });
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
