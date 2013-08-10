var sqlParser = require('./simpleSqlParser'),
    inspect = require('util').inspect,
    log = function (data) { console.log(inspect(data, { depth: null })); };

module.exports = sqlTransform;
function sqlTransform(sql) {
  var ast = sqlParser.sql2ast(sql);
  var result = {};
  var tables = [], query = {};
  var where, from;

  if (from = ast.FROM) {
    tables = from.map(function (data) {
      return data.table;
    });
  }

  if (where = ast.WHERE) {
    query = expression(where);
  }

  return { tables: tables, query: query };
}

function expression(expr) {
  var predicate;
  var result;

  if (expr.logic) {
    result = logic(expr);
  } else if (expr.operator) {
    result = term(expr);
  }

  return result;
}

function logic(_logic) {
  var result = {};
  var op = '$' + _logic.logic.toLowerCase();
  result[op] = [];
  _logic.terms.forEach(function (_term) {
    //log(_term);
    result[op].push(expression(_term));
  });

  return result;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function term(_term) {
  var result = [];
  switch (_term.operator) {
    case '=':
      result = {};
      var rhs = _term.right;
      result[_term.left] =
        isString(rhs)
        ?  fixString(rhs) :
        isNumeric(rhs) ? parseFloat(rhs) : Boolean.valueOf(rhs);
      break;
  }
  return result;
}

function isString(str) {
  return (str.match(/^[\'\"](.*)[\'\"]$/gm));
}

function fixString(str) {
  return str.replace(/^[\'\"](.*)[\'\"]$/gm, '$1');
}
