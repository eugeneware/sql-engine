var sqlParser = require('./simpleSqlParser'),
    inspect = require('util').inspect,
    log = function (data) { console.log(inspect(data, { depth: null })); };

module.exports = sqlTransform;
function sqlTransform(sql) {
  var ast = sqlParser.sql2ast(sql);
  var result = {};
  var where;
  if (where = ast.WHERE) {
    result = expression(where);
  }
  return result;
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

function term(_term) {
  var result = [];
  switch (_term.operator) {
    case '=':
      result = {};
      result[_term.left] = fixString(_term.right);
      break;
  }
  return result;
}

function fixString(str) {
  return str.replace(/^[\'\"](.*)[\'\"]$/gim, '$1');
}
