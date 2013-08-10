var expect = require('chai').expect,
    levelup = require('levelup'),
    through = require('through'),
    rimraf = require('rimraf'),
    levelQuery = require('level-queryengine'),
    jsonqueryEngine = require('jsonquery-engine'),
    path = require('path');

describe('jsonquery', function() {
  var testData, db, dbPath = path.join(__dirname, '..', 'data', 'testdb');
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

  function batchData() {
    return testData.map(function (data, i) {
      return {
        key: i,
        value: data,
        type: 'put'
      };
    });
  }

  it('should be able to read data from the database', function(done) {
    db.query.use(jsonqueryEngine());
    db.batch(batchData(), query);
    function query(err) {
      if (err) return done(err);
      db.query({ $or: [ { name: 'Susan' }, { name: 'Edmund' } ] })
        .pipe(through(
          function (data) {
            expect(['Susan', 'Edmund']).to.include(data.name);
          },
          done));
    }
  });

  it('should be able to query against sublevels', function(done) {
    var users = levelQuery(db.sublevel('users'));
    users.query.use(jsonqueryEngine());
    var count = 0;
    users.query({ $or: [ { name: 'Susan' }, { name: 'Edmund' } ] })
      .pipe(through(
        function (data) {
          count++;
        },
        check));

    function check() {
      expect(count).to.equal(0);
      addSomeData();
    }

    function addSomeData() {
      var differentData =
        batchData()
        .map(function (data) {
          data.value.num *= 2;
          return data;
        });
      users.batch(differentData, checkDiffData);
    }

    function checkDiffData() {
      var count = 0;
      users.query({ $or: [ { name: 'Susan' }, { name: 'Edmund' } ] })
        .pipe(through(
          function (data) {
            count++;
          },
          function () {
            expect(count).to.equal(2);
            done();
          }));
    }
  });
});
