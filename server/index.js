const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 4001;
const HP_HOST = process.env.HP_HOST || "localhost";
const HP_PORT = process.env.HP_PORT || 8081;

console.log("HP_HOST: ", HP_HOST);
console.log("HP_PORT: ", HP_PORT);

const hp = require("../hp/uni-client");
const hpClient = new hp();
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
    console.log("POST Create record received data: ", record);

    const uri = "227066733A2F2F4445414442454546";
    console.log("hpConnection:", hpConnection);
    hpConnection.createRecord(uri, record)
      .then((result) => {
        const hash = result.hash;
        console.log("Record created successfully:", hash);
        res.json(result);
      })
      .catch((err) => {
        console.error("Error creating record:", err);
        res.status(500).json({ error: "Internal Server Error" });
      });
  });

  app.get("/retrieve", (req, res) => {
    const uri = req.query.id;
    // uri = '227066733A2F2F4445414442454546';
    console.log("GET Get record called: ", uri);

    hpConnection
      .readRecord(uri)
      .then((result) => {
  //       hash: '1550fbd02e4b726e151c0e0189d8d743c79a4dd451ae01c2232e1748c61a2bcc',
  // submissionStatus: Promise { <pending> }

        console.log("Record read successfully:", result);
        res.json(result);
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
