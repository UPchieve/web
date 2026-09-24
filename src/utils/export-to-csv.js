// https://gist.github.com/changhuixu/de092ee55a9e115abba988910bd68d41#file-csv-data-service-ts

// Excel and Sheets treat a cell starting with one of these as a formula.
// Prefixing with a single quote keeps it text (OWASP CSV injection guidance).
const FORMULA_INJECTION_LEAD = /^[=+\-@\t\r]/

// Without a BOM, Excel on Windows reads the file in the system code page and
// garbles accented names.
const UTF8_BOM = '\uFEFF'

// The formula guard skips non-string cells, so a number like -3 stays numeric.
// Admin reports leave it off and write their values unchanged.
function toCsv(
  rows,
  { guardFormulas = false, bom = false, lineEnding = '\n' } = {}
) {
  const separator = ','
  let keys
  if (rows[0] instanceof Map) keys = [...rows[0].keys()]
  else keys = Object.keys(rows[0])
  const csvContent =
    keys.join(separator) +
    lineEnding +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            const value = row instanceof Map ? row.get(k) : row[k]
            let cell = value === null || value === undefined ? '' : value
            if (
              guardFormulas &&
              typeof cell === 'string' &&
              FORMULA_INJECTION_LEAD.test(cell)
            )
              cell = `'${cell}`
            cell =
              cell instanceof Date
                ? cell.toLocaleString()
                : cell.toString().replace(/"/g, '""')
            if (cell.search(/("|,|\r|\n)/g) >= 0) {
              cell = `"${cell}"`
            }
            return cell
          })
          .join(separator)
      })
      .join(lineEnding)
  return bom ? UTF8_BOM + csvContent : csvContent
}

export default function exportToCsv(filename, rows, options) {
  if (!rows || !rows.length) {
    return
  }
  const blob = new Blob([toCsv(rows, options)], {
    type: 'text/csv;charset=utf-8;',
  })
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
