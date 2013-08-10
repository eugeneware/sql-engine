var sqlTransform = require('./sql-transform'),
    mysql = require('mysql2'),
    levelup = require('levelup'),
    through = require('through'),
    levelQuery = require('level-queryengine'),
    jsonqueryEngine = require('jsonquery-engine'),
    jsonPaths = require('./json-paths');
    after = require('after');

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

module.exports = createServer;
function createServer(db, port, host, backlog, cb) {

  var server = mysql.createServer();
  server.listen(port, undefined, undefined, cb);
  server.on('connection', function(conn) {
    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff
    });

    conn.on('query', function(sql) {
      var jsq = sqlTransform(sql);
      console.log(jsq);
      var rows = [];
      var cols = {};
      var next = after(jsq.tables.length, finish);
      jsq.tables.forEach(function (table) {
        var sublevel = db.sublevel(table);
        var select = jsq.select.map(function (data) {
          return data.split('.');
        });
        sublevel.query(jsq.query)
          .pipe(through(
            function (data) {
              var result = {}, colName;
              select.forEach(function (colPath) {
                if (colPath.length === 1 && colPath[0] === '*') {
                  var slices = jsonPaths.slice(data);
                  slices.forEach(function (slice) {
                    colName = slice.key.join('.');
                    if (!(colName in cols)) {
                      cols[colName] = slice.value;
                    }
                    result[colName] = slice.value;
                  });
                } else {
                  colName = colPath.join('.');
                  cols[colName] = true;
                  var val = jsonPaths.walk(data, colPath);
                  if (!(colName in cols)) {
                    cols[colName] = val;
                  }
                  result[colName] = val;
                }
              });
              rows.push(result);
            }, next));
      });

      function finish() {
        if (rows.length) {
          rows.forEach(function (row) {
            Object.keys(cols).forEach(function (colName) {
              row[colName] = row[colName] || 'NULL';
            });
          });
          var defs = getColumnDefinitions('levelup', 'mysub', cols);
          conn.writeTextResult(rows, defs);
        } else {
          conn.writeOk(0);
        }
      }
    });
  });

  return server;
}
