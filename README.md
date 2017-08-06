# chain-wacher
> A [Service](https://bitcore.io/guides/service-development) for [bitcore](https://bitcore.io)

## How to install
```
$ npm install [-g] chain-watcher
$ bitcore-node add chain-watcher
```
> you may need to re-start the bitcore-node

## How to store addresses
> We don't really need mysql or mongodb or any databse. Wherever your `bitcore-node.json` resides, simply create a `addresses` directory, which should contain all the files, where each file name is simply the transaction input address, without any extension. Internally each file may contain any other information in json format.

## Read more about bitcore service
> [Guide](https://bitcore.io/guides/service-development)

## License
MIT © [Ramesh Kumar](codeofnode-at-the-rate-gmail-dot-com)
