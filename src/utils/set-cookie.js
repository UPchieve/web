// https://stackoverflow.com/a/24103596
const setCookie = (name, value, days = 365, years = 10) => {
  let date = new Date()
  date.setTime(date.getTime() + 3600 * 24 * days * years)
  const expires = 'expires=' + date.toUTCString()
  document.cookie = `${name}=${value}; ${expires}; path=/`
}

export default setCookie
