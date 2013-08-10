var expect = require('chai').expect,
    sqlTransform = require('../lib/sql-transform'),
    inspect = require('util').inspect,
    log = function (data) { console.log(inspect(data, { depth: null })); };

describe('sql-engine', function() {
  it('should be able to convert a simple sql to a simple json query', function(done) {
    var sql = "SELECT * FROM phone INNER JOIN x ON (phone.x = x.x) WHERE (name = 'Eugene' OR name = 'Susan') AND num = 42";
    //var sql = "SELECT * FROM phone INNER JOIN x ON (phone.x = x.x) WHERE name = 'Eugene'";
    //var sql = "SELECT * FROM phone WHERE name = 'Eugene'";
    var jsq =
      { '$and': [ { '$or': [ { name: 'Eugene' }, { name: 'Susan' } ] }, { num: '42' } ] };
    var result = sqlTransform(sql);
    expect(result).to.deep.equals(jsq);
    done();
  });
});
