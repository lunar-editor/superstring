const {assert} = require('chai')
const temp = require('temp').track()
const {TextBuffer} = require('../..')
const fs = require('fs')

describe('TextBuffer', () => {
  describe('.load', () => {
    if (!TextBuffer.prototype.load) return;

    it('loads the contents of the given filePath in the background', () => {
      const buffer = new TextBuffer()

      const {path: filePath} = temp.openSync()
      const content = 'a\nb\nc\n'.repeat(10 * 1024)
      fs.writeFileSync(filePath, content)

      const progressValues = []

      return buffer.load(filePath, (i) => progressValues.push(i))
        .then(() => {
          assert.equal(buffer.getText(), content)

          assert.deepEqual(progressValues, progressValues.map(Number).sort())
          assert(progressValues[0] >= 0)
          assert(progressValues[progressValues.length - 1] <= content.length)
        })
    })

    it('can load a file in a non-UTF8 encoding', () => {
      const buffer = new TextBuffer()

      const {path: filePath} = temp.openSync()
      const content = 'a\nb\nc\n'.repeat(10)
      fs.writeFileSync(filePath, content, 'utf16le')

      return buffer.load(filePath, 'UTF-16LE')
        .then(() => assert.equal(buffer.getText(), content))
    })

    it('rejects its promise if an invalid encoding is given', () => {
      const buffer = new TextBuffer()

      const {path: filePath} = temp.openSync()
      const content = 'a\nb\nc\n'.repeat(10)
      fs.writeFileSync(filePath, content, 'utf16le')

      let rejection = null
      return buffer.load(filePath, 'GARBAGE-16')
        .catch(error => rejection = error)
        .then(() => assert.equal(rejection.message, 'Invalid encoding name: GARBAGE-16'))
    })
  })

  describe('.setTextInRange', () => {
    it('mutates the buffer', () => {
      const buffer = new TextBuffer()

      buffer.setText('abc\ndef\nghi')
      assert.equal(buffer.getText(), 'abc\ndef\nghi')

      buffer.setTextInRange(Range(Point(0, 2), Point(1, 1)), 'Y')
      assert.equal(buffer.getText(), 'abYef\nghi')

      buffer.setTextInRange(Range(Point(0, 1), Point(5, 5)), 'O')
      assert.equal(buffer.getText(), 'aO')
    })
  })

  describe('.getTextInRange', () => {
    it('mutates the buffer', () => {
      const buffer = new TextBuffer()
      buffer.setText('abc\ndef\nghi')
      assert.equal(buffer.getTextInRange(Range(Point(0, 1), Point(0, 2))), 'b')
      assert.equal(buffer.getTextInRange(Range(Point(0, 1), Point(1, 2))), 'bc\nde')
      assert.equal(buffer.getTextInRange(Range(Point(0, 1), Point(2, 8))), 'bc\ndef\nghi')
    })
  })

  describe('.lineLengthForRow', () => {
    it('returns the length of the line at the given index', () => {
      const buffer = new TextBuffer()
      buffer.setText('abc\r\ndefg\n\r\nhijkl')

      assert.equal(buffer.lineLengthForRow(0), 3)
      assert.equal(buffer.lineLengthForRow(1), 4)
      assert.equal(buffer.lineLengthForRow(2), 0)
      assert.equal(buffer.lineLengthForRow(3), 5)
    })
  })
})

function Range(start, end) {
  return {start, end}
}

function Point(row, column) {
  return {row, column}
}