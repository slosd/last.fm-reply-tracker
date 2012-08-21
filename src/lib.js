function GMY_optionExits(key) {
  var value = GM_getValue(key, "undefined");
  return (value != "undefined" && value != "");
}