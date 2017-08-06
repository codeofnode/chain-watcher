import assert from 'assert'
const main = require(`../${process.env.TEST_DIR||'src'}/src/index`).default

describe('test 1', () => {
  describe('simplest', () => {
    it('a check', (done) => {
      assert(typeof (new main({datadir : 'ab', node: { getRawBlock: function(){} }})).logError,'function');
      done();
    })
  });
})
