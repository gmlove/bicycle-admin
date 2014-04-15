exports.sendResult = function() {
  var code = 0
    , result = null
    , res = null;
  if (arguments.length == 3) {
    code = arguments[0];
    result = arguments[1];
    res = arguments[2];
  } else {
    result = arguments[0];
    res = arguments[1];
  }
  res.json({code: code, data: result});
};