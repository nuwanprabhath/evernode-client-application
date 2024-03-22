const express = require("express");
const cors = require("cors");
require("dotenv").config();
const utils = require("./utils/nftUtils");

const PORT = process.env.PORT || 4001;
const HP_HOST = process.env.HP_HOST || "localhost";
const HP_PORT = process.env.HP_PORT || 8081;
const XAHAU_SECRET = process.env.XAHAU_SECRET;
const XAHAU_PUBLIC_KEY = process.env.XAHAU_PUBLIC_KEY;
const XAHAU_WS_URL = process.env.XAHAU_WS_URL;
const XAHAU_HTTP_URL = process.env.XAHAU_HTTP_URL;

console.log("PORT: ", PORT);
console.log("HP_HOST: ", HP_HOST);
console.log("HP_PORT: ", HP_PORT);
console.log("XAHAU_WS_URL: ", XAHAU_WS_URL);
console.log("XAHAU_HTTP_URL: ", XAHAU_HTTP_URL);

const hp = require("../hp/uni-client");
const hpClient = new hp();

const xhClient = require("../xahau/xahau-client");
const xh = new xhClient(
  XAHAU_PUBLIC_KEY,
  XAHAU_SECRET,
  XAHAU_WS_URL,
  XAHAU_HTTP_URL
);

hpClient.initialize(HP_HOST, HP_PORT).then(startup).catch(handleErr);

function startup(hpConnection) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded());

  app.get("/", (req, res) => {
    res.json({ message: "Hello from the server" });
  });

  app.post("/record", (req, res) => {
    const record = req.body;
    const studentAccount = record.studentAccount;
    console.log("POST Create record received data: ", record);
    // console.log("hpConnection:", hpConnection);
    // const uri = utils.generateURI();
    const uri = record.uri;

    console.log("Student URI: ", uri);

    return xh
      .mintUri(studentAccount, uri)
      .then((result) => {
        const nftHash = result.id;
        record.nftHash = nftHash;

        console.log("Success minting NFT. Hash: ", nftHash);
        console.log(result);

        return hpConnection
          .createRecord(uri, record)
          .then((result) => {
            const hash = result.hash;
            console.log("Record created successfully:", hash);
            res.json(result);
          })
          .catch((err) => {
            console.error("Error creating record:", err);
            res.status(500).json({ error: "Internal Server Error" });
          });
      })
      .catch((err) => {
        console.log("Error minting URI");
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
      });
  });

  app.get("/retrieve", (req, res) => {
    const uri = req.query.id;
    // uri = '227066733A2F2F4445414442454546';
    console.log("GET Get record called: ", uri);

    return hpConnection
      .readRecord(uri)
      .then((result) => {
        //       hash: '1550fbd02e4b726e151c0e0189d8d743c79a4dd451ae01c2232e1748c61a2bcc',
        // submissionStatus: Promise { <pending> }

        console.log("Record read successfully:", result);
        if (!result){
          return res.status(404).json({ error: "Record not found" });
        }
        return res.json(result);
      })
      .catch((err) => {
        console.error("Error reading record:", err);
        res.status(500).json({ error: "Internal Server Error" });
      });
  });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

function handleErr(err) {
  console.error("Error initializing HP connection:", err);
}
