module.exports = jsonPaths;
function jsonPaths(parts, data, cb) {
  var paths = [];
  if (data !== null && typeof data === 'object') {
    saveChildren();
  } else {
    paths.push({ key: parts, value: data });
    cb(null, paths);
  }

  function saveChildren() {
    var keys = Object.keys(data);
    var count = keys.length;
    keys.forEach(function (key) {
      var value = data[key];
      if (typeof value === 'object') {
        jsonPaths(parts.concat(key), value, function (err, _paths) {
          paths = paths.concat(_paths);
          --count || cb(null, paths);
        });
      } else {
        paths.push({ key: parts.concat(key), value: data[key] });
        --count || cb(null, paths);
      }
    });
  }
}
