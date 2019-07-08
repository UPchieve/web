export default {
  // see http://regexlib.com/REDetails.aspx?regexp_id=58
  // modified to ignore trailing/leading whitespace,
  // and disallow alphanumeric characters
  re: /^\s*([0-9](?: |-)?)?(?:\(?([0-9]{3})\)?|[0-9]{3})(?: |-)?(?:([0-9]{3})(?: |-)?([0-9]{4}))\s*$/,
  validatePhoneNumber: function (v) {
    return this.re.test(v)
  },
  // convert phone number into the accepted format ###-###-####
  convertPhoneNumber: function (v) {
    var matches = v.match(this.re)
    if (matches == null || matches.length < 5) {
      return null
    }
    return matches[2] + '-' + matches[3] + '-' + matches[4]
  }
}
