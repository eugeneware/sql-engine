var expect = require('chai').expect,
    util = require('util'),
    sqlParser = require('../lib/simpleSqlParser');

describe('sql parser', function() {
  it('should be able to parse some simple sql', function(done) {
    var stmt, ast;
    stmt = 'SELECT phone.name, phone.num, user.id, user.email FROM phone INNER JOIN user ON (phone.email = user.email) WHERE name like "Eugene%" ORDER BY num DESC';
    ast = sqlParser.sql2ast(stmt); console.log(util.inspect(ast, { depth: null }));
    stmt = 'INSERT INTO phone(name, num) VALUES ("bob", 1234)';
    ast = sqlParser.sql2ast(stmt); console.log(util.inspect(ast, { depth: null }));
    stmt = 'UPDATE phone SET name = "Eugene2", num = 789 WHERE name = "eugene"';
    ast = sqlParser.sql2ast(stmt); console.log(util.inspect(ast, { depth: null }));
    done();
  });
});
