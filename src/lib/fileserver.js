import { readdir, mkdir, rmdir, readFile, writeFile, unlink } from 'fs';
import { join } from 'path';
import promisify from 'util.promisify';

/**
 * An instance of [Promise]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}.
 * @typedef {Promise} Promise
 */

/**
 * Promisified fs.mkdir.
 * @return {Promise} promise - return a promise
 */
const pmMkdir = promisify(mkdir);

/**
 * Promisified fs.rmdir.
 * @return {Promise} promise - return a promise
 */
const pmRmdir = promisify(rmdir);

/**
 * Promisified fs.readdir
 * @return {Promise} promise - return a promise
 */
const pmReaddir = promisify(readdir);

/**
 * Promisified fs.readFile
 * @return {Promise} promise - return a promise
 */
const pmReadFile = promisify(readFile);

/**
 * Promisified fs.writeFile
 * @return {Promise} promise - return a promise
 */
const pmWriteFile = promisify(writeFile);

/**
 * Promisified fs.unlink
 * @return {Promise} promise - return a promise
 */
const pmUnlink = promisify(unlink);

/**
 * @module fs
 */

/**
 * Creates a file server to list, read, create, update or delete file.
 * @class
 */
class FileServer {
  /**
   * Create an instance of file server.
   * @param {string} dirpath - the root directory path, that belongs to an instance (not an project)
   */
  constructor(dirpath) {
    this.dirpath = dirpath;
  }

  /**
   * list all the files in a directory.
   * @param {string} dpath - the directory path, that should be read
   */
  async list(dpath) {
    return (await pmReaddir(join(this.dirpath, dpath)))
      .filter(a => !a.startsWith('.'));
  }

  /**
   * list all the directories in a directory.
   * @param {string} dpath - the directory path, that should be read
   */
  async listdir(dpath) {
    return (await pmReaddir(join(this.dirpath, dpath))).filter(a => a.indexOf('.') === -1);
  }

  /**
   * read a file in a directory.
   * @param {string} fpath - the file path, that should be read
   */
  async read(fpath) {
    let filejson = String(await pmReadFile(join(this.dirpath, fpath)));
    try {
      filejson = JSON.parse(filejson);
    } catch (er) {
      // not a json
    }
    return filejson;
  }

  /**
   * create or update a file in a directory.
   * @param {string} fpath - the file path, that should be created/updated
   * @param {object} data - the file content in json format
   */
  write(fpath, data) {
    return pmWriteFile(join(this.dirpath, fpath), JSON.stringify(data, undefined, 2));
  }

  /**
   * delete a file in a directory.
   * @param {string} fpath - the file path, that should be deleted
   */
  del(fpath) {
    return pmUnlink(join(this.dirpath, fpath));
  }

  /**
   * create a dir.
   * @param {string} dath - the directory path, that should be created
   */
  mkdir(dpath) {
    return pmMkdir(join(this.dirpath, dpath));
  }

  /**
   * delete a dir.
   * @param {string} dath - the directory path, that should be deleted
   */
  rmdir(dpath) {
    return pmRmdir(join(this.dirpath, dpath));
  }
}

export default FileServer;
