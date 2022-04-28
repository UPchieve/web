// https://stackoverflow.com/a/24103596
const getCookie = name => {
  const nameEquality = `${name}=`
  let ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEquality) == 0) {
      return c.substring(nameEquality.length, c.length)
    }
  }
  return null
}

export default getCookie
