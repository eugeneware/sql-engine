var expect = require('chai').expect,
    mysql = require('mysql2');

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
  var server;

  it('should be able to proxy a simple request', function(done) {
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
        console.log('field list:', table, fields);
        conn.writeEof();
      });

      var remote = mysql.createConnection({
        user: 'root',
        database: 'triggertest',
        host:'localhost',
        password: 'iluvhslim2'
      });

      conn.on('query', function(sql) {
        console.log('proxying query:' + sql);
        remote.query(sql, function(err) {
          if (Array.isArray(arguments[1])) {
            // response to a 'select', 'show' or similar
            var rows = arguments[1], columns = arguments[2];
            if (rows.length) {
              var defs = getColumnDefinitions('levelup', 'mysub', rows[0]);
              conn.writeTextResult(rows, defs);
            } else {
              conn.writeOk(0);
            }
          } else {
            // response to an 'insert', 'update' or 'delete'
            var result = arguments[1];
            conn.writeOk(result);
          }
        });
      });

      conn.on('end', remote.end.bind(remote));
    });

    function doQuery() {
      var clientConn = mysql.createConnection({
        user: 'root',
        database: 'triggertest',
        host:'localhost',
        password: 'iluvhslim2',
        port: 3307
      });

      clientConn.query('SELECT * FROM test4 WHERE name = \'Eugene\'',
        function (err, rows, fields) {
          if (err) return done(err);
          console.log(rows);
          server._server.close();
          done();
        });
    }
  });
});
