#! /usr/bin/env node

import options from './lib/extractArgs';
import Main from './src';

/* The fixture addresses to watch
 * @const
 */
const FixturesAddresses = [
  '2Mxs1sYMGh2dR5tHBLCMnhdjMim8Kvn88wW',
  '2MvVK98nuCj9TsPWJ855njDT733CKwpVdCw',
  '2N3xPEq3AiWXgW6QnyN15efaMqVPC1SBsTd',
  '2N5xZUhG3mTpUhRd6FCFuFXUhwA1TQ9Zy4z',
  '2MvVPENNKb2gLHvnR7WRWjSB3F7HpnfD2ZV',
];

class Service extends Main {
  constructor(opts) {
    Object.assign(opts, { addresses: FixturesAddresses.map(ad => ad) }, options);
    super(opts);
  }
}

export default Service;
