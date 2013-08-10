module.exports.slice = slice;
function slice(parts, data) {
  if (arguments.length < 2) {
    data = parts;
    parts = [];
  }

  var paths = [];
  if (data !== null && typeof data === 'object') {
    return saveChildren();
  } else {
    paths.push({ key: parts, value: data });
    return paths;
  }

  function saveChildren() {
    var keys = Object.keys(data);
    keys.forEach(function (key) {
      var value = data[key];
      if (typeof value === 'object') {
        paths = paths.concat(slice(parts.concat(key), value));
      } else {
        paths.push({ key: parts.concat(key), value: data[key] });
      }
    });

    return paths;
  }
}

module.exports.walk = walk;
function walk(obj, path) {
  while (path.length > 0) {
    var prop = path.shift();
    if (obj[prop] !== undefined) {
      obj = obj[prop];
    } else {
      return;
    }
  }
  return obj;
}
