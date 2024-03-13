const crypto = require('crypto');
const xrpl = require("xrpl");

function generateURI() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uri = '';

    for (let i = 0; i < 30; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        uri += characters.charAt(randomIndex);
    }

    // return xrpl.convertStringToHex(uri);
    return uri;
}

function calculateDigest(uri) {
    const algorithm = 'sha256';
    const digest = crypto.createHash(algorithm).update(uri).digest('hex');
    return digest;
}

module.exports = {
    generateURI,
    calculateDigest
};