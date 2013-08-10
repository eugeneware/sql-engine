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

    var paths = jsonPaths.slice([], obj, function (err, slices) {
      if (err) return done(err);
      var paths = slices.map(function (data) {
        return data.key.join('.');
      });
      expect(paths).to.deep.equals(
        [ 'name', 'car.make', 'car.model', 'tags.0', 'tags.1', 'tags.2' ]);
      done();
    });
  });

  it('should be able to traverse a path', function(done) {
    var obj = {
      name: 'Bob',
      car: {
        make: 'Toyota',
        model: 'Camry'
      },
      tags: [ 'tag1', 'tag2', 'tag3' ]
    };

    var path = ['tags', 1];

    var prop = jsonPaths.walk(obj, path);
    expect(prop).to.equal('tag2');

    done();
  });
});
