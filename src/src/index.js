/* global global */
/* eslint class-methods-use-this: 0 */

import bitcore from 'bitcore-lib';
import { EventEmitter } from 'events';
import promisify from 'util.promisify';
import FileServer from '../lib/fileserver';
import logger from '../lib/logger';
import { noop } from '../lib/util';

/**
 * @module watcher
 */

/**
 * A Watch service class
 * @class
 */
class WatchService extends EventEmitter {
  /**
   * Create an instance of class WatchService.
   * @param {object} opts - the options required to initiate the class
   */
  constructor(opts) {
    super();
    this.options = opts;
    this.fs = new FileServer(opts.datadir);
    this.logger = logger;
    this.totalAmount = 0;
    this.hits = 0;
    this.node = opts.node;
    this.tip = null;
    this.addresses = opts.addresses;
    this.getNextBlock = promisify(this.node.getRawBlock);
  }

  /**
   * We are going to need bitcoind because we will be setting event listeners (subscribers)
   * on Blocks and such
   */
  static get dependencies() {
    return ['bitcoind'];
  }

  /**
   * Find the transaction hash from transaction object
   * @param {object} tx - the parsed transaction object
   * @return {string} hash - the transaction hash
   */
  static findTransactionHash(tx) {
    return tx.id;
  }

  /**
   * Find the outputs from a transaction handler arguments
   * @return {Object[]} arr - the array of inputs
   */
  static findInputs(tx) {
    return tx.inputs;
  }

  /**
   * start the service
   * @param {function} [callback] - if found, to be called when the service is started
   */
  start(callback = noop) {
    this.loadFixtures().then(() => {
      this.tip = bitcore.Block.fromBuffer(this.node.services.bitcoind.genesisBuffer);
      this.tip.height = 0;
      this.once('ready', () => {
        this.logger.log('Bitcoin Database Ready');
        this.node.services.bitcoind.on('tx', this.transactionHandler.bind(this));
        this.node.services.bitcoind.on('tip', () => {
          if (!this.node.stopping) {
            // to avoid deprecation warning by node. Its good habbit to handle the promise errors
            this.sync().then(callback, (er) => {
              this.logger.error('Have to STOP..! ERROR found which syncing.');
              this.showSum();
              throw er;
            });
          }
        });
      });
    }, this.logger.error);
  }

  /**
   * stop the service
   * @param {function} [callback] - if found, to be called when the service is stopped
   */
  stop(callback = noop) {
    callback();
  }

  /**
   * get API methods
   */
  getAPIMethods() {
    return [];
  }

  /**
   * get published events
   */
  getPublishEvents() {
    return [];
  }

  /**
   * load the fixtures
   * @return {String[]} addrs - the list of addresses after loading fixtures
   */
  async loadFixtures() {
    const list = await this.fs.list('');
    if (list.length) {
      this.addresses = list;
      (await Promise.all(list.map(adr => this.fs.read(adr)))).forEach((file) => {
        Object.keys(file).forEach((addr) => {
          const value = parseInt(file[addr], 10);
          if (!isNaN(value)) {
            this.totalAmount += value;
          }
        });
      });
    } else {
      await Promise.all(this.addresses.map(adr => this.fs.write(adr, {})));
    }
  }

  /**
   * This function will synchronize additional indexes for the chain based on
   * the current active chain in the bitcoin daemon.
   */
  async sync() {
    if (this.bitcoindSyncing || this.node.stopping || !this.tip) {
      return;
    }
    this.bitcoindSyncing = true;
    let bBuff; // block buffer
    while (!this.node.stopping && this.tip.height < this.node.services.bitcoind.height) {
      bBuff = await this.getNextBlock(this.tip.height + 1); // eslint-disable-line no-await-in-loop
      const block = bitcore.Block.fromBuffer(bBuff);
      const prevHash = bitcore.util.Buffer.reverse(block.header.prevHash).toString('hex');
      if (prevHash === this.tip.hash) {
        // This block appends to the current chain tip and we can
        // immediately add it to the chain and create indexes.
        // Populate height
        block.height = this.tip.height + 1;
        this.tip = block;
        this.logger.log('Chain added block to main chain');
        this.emit('addblock', block);
        this.blockHandler(block);
      } else {
        // This block doesn't progress the current tip, so we'll attempt
        // to rewind the chain to the common ancestor of the block and
        // then we can resume syncing.
        this.logger.warn(`Reorg detected! Current tip: ${this.tip.hash}`);
      }
    }
  }

  /**
   * block handler. This is the delegate when a block is received while syncing
   * @param {object} block - the block received
   */
  blockHandler(block) {
    // Loop through every transaction in the block
    block.transactions.forEach(this.transactionHandler.bind(this));
    this.logger.log(`Block Number ${block.height} Found : ${block.hash}`);
  }

  /**
   * Showing the commulative sum of balances
   */
  showSum() {
    this.logger.log(`\n----CURRENT TOTAL AMOUNT---->\n ${this.totalAmount} satoshis`);
  }

  /**
   * Transaction input handler. When a transaction input is received by your node
   * @param {Object} input - the transaction input recieved
   */
  txInputHandler(input) {
    if (input.script) {
      const address = input.script.toAddress(this.node.network);
      if (address && this.addresses.indexOf(String(address)) !== -1) {
        this.hits += 1;
        this.logger.log(`\n=====*******======>Yippee.. Got some coins\nworth: ${input.amount} satoshis`);
        if (input.output && input.output.satoshis) {
          this.logger.log(`nworth: ${input.output.satoshis} satoshis`);
        }
        this.totalAmount += input.output.satoshis;
        // TODO some other stuffs can be done like sync with data directory
      }
    }
  }

  /**
   * Transaction handler. This is the delegate when a transaction is received by your node
   * @param {Buffer|Object} txBuffer - the transaction buffer or object recieved
   */
  transactionHandler(txBuffer) {
    let tx = txBuffer;
    if (tx instanceof Buffer) {
      tx = bitcore.Transaction().fromBuffer(txBuffer);
    }
    const transctionHash = WatchService.findTransactionHash(tx);
    this.logger.log('\n---->A transaction found');
    this.logger.log(`\ntransaction hash: ${transctionHash}\n`);
    WatchService.findInputs(tx).forEach(this.txInputHandler.bind(this));
    if (this.hits >= this.addresses.length) {
      this.showSum();
    }
  }
}

export default WatchService;
