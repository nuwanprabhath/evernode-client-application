const nftUtil = require("./nftUtils");

const uri = nftUtil.generateURI();
console.log("Generated URI: ", uri);

const digest = nftUtil.calculateDigest(uri);
console.log("Calculated digest: ", digest);