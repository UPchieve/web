import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import exportToCsv from '@/utils/export-to-csv'

let blobs: Blob[] = []

beforeEach(() => {
  blobs = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:test'
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function csvFrom(
  rows: Record<string, unknown>[],
  options?: Record<string, unknown>
): Promise<string | undefined> {
  exportToCsv('members.csv', rows, options)
  return blobs.length ? await blobs[blobs.length - 1].text() : undefined
}

const body = (csv: string) => csv.split('\n').slice(1)

describe('exportToCsv', () => {
  it('writes a header from the first row, then one line per row', async () => {
    const csv = await csvFrom([
      { name: 'Alex', sessions: 3 },
      { name: 'Sam', sessions: null },
    ])
    expect(csv).toBe('name,sessions\nAlex,3\nSam,')
  })

  it('downloads nothing when there are no rows', async () => {
    expect(await csvFrom([])).toBeUndefined()
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
  })

  it('quotes a cell holding a comma, quote or line break and doubles embedded quotes', async () => {
    const csv = await csvFrom([
      { a: 'Jo, "JJ"' },
      { a: 'two\nlines' },
      { a: 'cr\r' },
    ])
    expect(body(csv!)).toEqual(['"Jo, ""JJ"""', '"two', 'lines"', '"cr\r"'])
  })

  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'guards a string cell starting with %j against formula injection when asked',
    async (lead) => {
      const rows = [{ name: `${lead}HYPERLINK(1,1)` }]
      expect(await csvFrom(rows, { guardFormulas: true })).toContain(
        `'${lead}HYPERLINK(1,1)`
      )
      expect(await csvFrom(rows)).not.toContain(`'${lead}`)
    }
  )

  it('leaves numbers alone under the formula guard', async () => {
    const csv = await csvFrom([{ n: -3 }], { guardFormulas: true })
    expect(body(csv!)).toEqual(['-3'])
  })

  // Blob.text() decodes UTF-8 and drops a leading BOM, so read the bytes.
  it('starts with a UTF-8 BOM only when asked', async () => {
    const leadingBytes = async (options?: Record<string, unknown>) => {
      await csvFrom([{ name: 'Zoë' }], options)
      const buffer = await blobs[blobs.length - 1].arrayBuffer()
      return [...new Uint8Array(buffer).slice(0, 3)]
    }

    expect(await leadingBytes({ bom: true })).toEqual([0xef, 0xbb, 0xbf])
    expect(await leadingBytes()).not.toEqual([0xef, 0xbb, 0xbf])
  })

  it('joins rows with LF unless a caller asks for a different line ending', async () => {
    const rows = [{ a: 1 }, { a: 2 }]
    expect(await csvFrom(rows)).toBe('a\n1\n2')
    expect(await csvFrom(rows, { lineEnding: '\r\n' })).toBe('a\r\n1\r\n2')
  })
})
