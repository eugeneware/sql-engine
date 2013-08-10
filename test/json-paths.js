var expect = require('chai').expect,
    jsonPaths = require('../lib/json-paths');

describe('json paths', function() {
  it('should be able to slice an object', function(done) {
    var obj = {
      name: 'Bob',
      car: {
        make: 'Toyota',
        model: 'Camry'
      },
      tags: [ 'tag1', 'tag2', 'tag3' ]
    };

    var paths = jsonPaths([], obj, function (err, slices) {
      if (err) return done(err);
      var paths = slices.map(function (data) {
        return data.key.join('.');
      });
      console.log(paths);
    });
    done();
  });
});
