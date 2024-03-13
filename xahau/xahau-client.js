const xrpl = require("xrpl");
const nftUtil = require("../server/utils/nftUtils");

class XrplClient {
  constructor(serverUrl = "wss://s.altnet.rippletest.net:51233") {
    this.client = new xrpl.Client(serverUrl);
    this.client.connect().then(() => {
      console.log("Connected to XRPL");
    });
    this.account = this.getAccount;
    this.wallet = xrpl.Wallet.fromSeed(this.account.secret);
  }

  async getAccount() {
    // const wallet = xrpl.Wallet.generate();
    // const address = wallet.getAddress();
    // const secret = wallet.getSecret();
    return { address, secret };
    // return account;
  }

  async getBalance() {
    const balances = await this.client.getBalances(this.account.address);
    return balances;
  }

  async mintNFT(destination, uri) {
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
    const result = await client.submitAndWait(signed.tx_blob)
    console.log("XH: NFT mint transaction result: ", result)
  }
}
