// const xrpl = require("xrpl");
const { sign, derive, XrplDefinitions, binary } = require("xrpl-accountlib");
const { XrplApi, Defaults } = require("evernode-js-client");
const https = require('https');
const nftUtil = require("../server/utils/nftUtils");
const xhClient = require('../xahau/xahau-client.js');

class XrplClient {
  constructor(
    pubKey,
    secret,
    serverUrlWs = "wss://xahau-test.net",
    serverUrlHttp = "https://xahau-test.net"
  ) {
    this.address = pubKey;
    this.secret = secret;
    // this.wallet = xrpl.Wallet.fromSeed(this.secret);
    this.serverUrlWs = serverUrlWs;
    this.serverUrlHttp = serverUrlHttp;

    // Defaults.set({
    //   networkID: 21338,
    // });

    // if (serverUrlWs)
    //   Defaults.set({
    //     rippledServer: serverUrlWs,
    //   });

    // this.xrplApi = new XrplApi();

    // Defaults.set({
    //   xrplApi: this.xrplApi,
    // });
  }

  async getAccount() {
    // const wallet = xrpl.Wallet.generate();
    // const address = wallet.getAddress();
    // const secret = wallet.getSecret();
    return {
      address: this.address,
      secret: this.secret,
    };
    // return account;
  }

  async getBalance() {
    const balances = await this.client.getBalances(this.account.address);
    return balances;
  }

  async mintUri(destinationAccount, uri) {
    console.log("XH: Minting URI: ["+uri+"] to account: ["+destinationAccount+"]");

    Defaults.set({
      networkID: 21338,
    });

    if (this.serverUrlWs)
      Defaults.set({
        rippledServer: this.serverUrlWs,
      });

    this.xrplApi = new XrplApi();

    Defaults.set({
      xrplApi: this.xrplApi,
    });

    await this.xrplApi.connect();

    const accountInfo = await this.xrplApi.getAccountInfo(this.address);

    var preparedTransaction = {
      TransactionType: "URITokenMint",
      Account: this.address,
      Flags: 1,
      URI: uri,
      //"Digest": "697066733A2F2F4445414442454546697066733A2F2F44454144424545467878",
      Destination: destinationAccount,
      Amount: "1",
      /*{
            //"issuer": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "currency": currency,
            "value": "10",
          },*/
      Fee: "10",
      Sequence: accountInfo.Sequence,
      LastLedgerSequence: this.xrplApi.ledgerIndex + 10,
      NetworkID: 21338,
    };

    const body = {
      method: "server_definitions",
      params: [{}],
    };
    const definition = await this.httpPost(this.serverUrlHttp, body);

    const xrplDefinitions = new XrplDefinitions(definition.result);

    const account = derive.familySeed(this.secret);
    // console.log(account);
    const signed = sign(preparedTransaction, account, xrplDefinitions);

    const signedTxn = {
      hash: signed.id,
      tx_blob: signed.signedTransaction,
    };

    // console.log(signedTxn);

    let result = await this.xrplApi.submitAndWait(
      preparedTransaction,
      signedTxn.tx_blob
    );

    // console.log(result);

    // Disconnect from the client
    await this.xrplApi.disconnect();
    return result;
  }

  httpPost(url, body) {
    return new Promise((resolve, reject) => {
      // Convert the request body object to a string
      const data = JSON.stringify(body);

      // Parse the URL
      const urlObj = new URL(url);

      // Define the options for the request
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      };

      // Create the request
      const req = https.request(options, (res) => {
        let response = "";

        // Collect response data
        res.on("data", (chunk) => {
          response += chunk;
        });

        // Resolve the promise on end
        res.on("end", () => {
          try {
            // Attempt to parse JSON response
            resolve(JSON.parse(response));
          } catch (e) {
            reject(e);
          }
        });
      });

      // Reject the promise on request error
      req.on("error", (error) => {
        reject(error);
      });

      // Write the request body and end the request
      req.write(data);
      req.end();
    });
  }

  async mintNFT_Old(destination, uri) {
    const mintTx = {
      TransactionType: "NFTokenMint",
      Account: this.account.address,
      URI: uri,
      Digest: nftUtil.calculateDigest(uri),
      Destination: destination,
      NFTokenTaxon: 0,
      Flags: 0,
    };
    const prepared = await client.autofill(mintTx);
    const signed = this.wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    console.log("XH: NFT mint transaction result: ", result);
  }
}

module.exports = XrplClient;