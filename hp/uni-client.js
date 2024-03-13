const fs = require('fs');
const HotPocket = require('hotpocket-js-client');

class UniClient {
    constructor() {
        this.keyFile = 'user.key';
        this.client = null;
    }

    async initialize(ip = 'localhost', port = '8081') {
        await this.generateKeys();
        await this.connect(ip, port);
        return this;
    }

    async generateKeys() {
        if (!fs.existsSync(this.keyFile)) {
            const newKeyPair = await HotPocket.generateKeys();
            const saveData = Buffer.from(newKeyPair.privateKey).toString('hex');
            fs.writeFileSync(this.keyFile, saveData);
            console.log('HP: New key pair generated.');
        }
    }

    async connect(ip, port) {
        const savedPrivateKeyHex = fs.readFileSync(this.keyFile).toString();
        const userKeyPair = await HotPocket.generateKeys(savedPrivateKeyHex);
        const pkhex = Buffer.from(userKeyPair.publicKey).toString('hex');
        
        console.log('HP: My public key is: ' + pkhex);
        console.log('HP: Connecting to: ' + ip + ':' + port);
        
        this.client = await HotPocket.createClient(['wss://' + ip + ':' + port], userKeyPair);
        this.client.on(HotPocket.events.disconnect, () => {
            console.log('HP: Disconnected');
        });
        
        this.client.on(HotPocket.events.connectionChange, (server, action) => {
            console.log(server + " " + action);
        });
        
        this.client.on(HotPocket.events.contractOutput, (r) => {
            r.outputs.forEach(o => {
                if (o?.type == 'data_result') {
                    console.log('\x1b[32m%s\x1b[0m', `Output >> ${o.data}`);
                } else if (o?.type == 'error') {
                    console.log('\x1b[31m%s\x1b[0m', `Error >> ${o.error}`);
                }
            });
        });
        
        if (!await this.client.connect()) {
            console.log('HP: Connection failed.');
            throw new Error('HP: Connection failed.');
        }
        console.log('HP: HotPocket Connected.');
    }

    async createRecord(uri, record) {
        const createCommand = {
            type: 'CREATE_RECORD',
            uri: uri,
            record: record,
        };
        const res = await this.client.submitContractInput(JSON.stringify(createCommand));
        if (res?.type == 'data_result') {
            console.log('\x1b[32m%s\x1b[0m', `Output >> ${res.data}`);
        } else if (res?.type == 'error') {
            console.log('\x1b[31m%s\x1b[0m', `Error >> ${res.error}`);
        }
        return res;
    }

    async readRecord(uri) {
        const readCommand = {
            type: 'READ_RECORD',
            uri: uri,
        };
        const res = await this.client.submitContractReadRequest(JSON.stringify(readCommand));
        if (res?.type == 'data_result') {
            console.log('\x1b[32m%s\x1b[0m', `Output >> ${res.data}`);
            return res;
        } else if (res?.type == 'error') {
            console.log('\x1b[31m%s\x1b[0m', `Error >> ${res.error}`);
            throw new Error(`Error >> ${res.error}`);
        }
    }
}

module.exports = UniClient;

// async function uniClientApp() {

//     const keyFile = 'user.key';

//     // Re-generate a user key pair for the client.
//     if (process.argv[2] == 'generatekeys' || !fs.existsSync(keyFile)) {
//         const newKeyPair = await HotPocket.generateKeys();
//         const saveData = Buffer.from(newKeyPair.privateKey).toString('hex');
//         fs.writeFileSync(keyFile, saveData);
//         console.log('New key pair generated.');

//         if (process.argv[2] == 'generatekeys') {
//             const pkhex = Buffer.from(newKeyPair.publicKey).toString('hex');
//             console.log('My public key is: ' + pkhex);
//             return;
//         }
//     }
    
//     // Generate the key pair using saved private key data.
//     const savedPrivateKeyHex = fs.readFileSync(keyFile).toString();
//     const userKeyPair = await HotPocket.generateKeys(savedPrivateKeyHex);

//     const pkhex = Buffer.from(userKeyPair.publicKey).toString('hex');
//     console.log('My public key is: ' + pkhex);

//     // Simple connection to single server without any validations.
//     const ip = process.argv[2] || 'localhost';
//     const port = process.argv[3] || '8081';
//     console.log('Connecting to: ' + ip + ':' + port);
//     const client = await HotPocket.createClient(
//         ['wss://' + ip + ':' + port],
//         userKeyPair
//     );

//     client.on(HotPocket.events.disconnect, () => {
//         console.log('Disconnected');
//         rl.close();
//     })

//     // This will get fired as servers connects/disconnects.
//     client.on(HotPocket.events.connectionChange, (server, action) => {
//         console.log(server + " " + action);
//     })

//     // This will get fired when contract sends outputs.
//     client.on(HotPocket.events.contractOutput, (r) => {
//         r.outputs.forEach(o => {
//             if (o?.type == 'data_result') {
//                 console.log('\x1b[32m%s\x1b[0m', `Output >> ${o.data}`);
//             } else if (o?.type == 'error') {
//                 console.log('\x1b[31m%s\x1b[0m', `Error >> ${o.error}`);
//             }
//         });
//     })


//     // Establish HotPocket connection.
//     if (!await client.connect()) {
//         console.log('Connection failed.');
//         return;
//     }

//     // console.log('HotPocket Connected.');

//     // console.log("Ready to accept inputs.");
//     // console.log('\x1b[32m%s\x1b[0m', "Run 'help' for more information on commands.");

//     // // Creating a record
//     // const createCommand = {
//     //     type: 'CREATE_RECORD',
//     //     uri: '117066733A2F2F4445414442454546',
//     //     record: {
//     //         name: 'John Doe',
//     //         degree: 'BSc in Computer Science',
//     //         date: '05-06-2021'
//     //     },
//     // }

//     // // Reading a record
//     // const readCommand = {
//     //     type: 'READ_RECORD',
//     //     uri: '117066733A2F2F4445414442454546'
//     // }
    
//     // // console.log("Sending create command: ", createCommand);
//     // // const res = await client.submitContractInput(JSON.stringify(createCommand));

//     // console.log("Sending read command: ", readCommand);
//     // const res = await client.submitContractReadRequest(JSON.stringify(readCommand));
    
//     // if (res?.type == 'data_result') {
//     //     console.log('\x1b[32m%s\x1b[0m', `Output >> ${res.data}`);
//     // } else if (res?.type == 'error') {
//     //     console.log('\x1b[31m%s\x1b[0m', `Error >> ${res.error}`);
//     // }
    
// }

// uniClientApp();