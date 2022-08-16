import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';
import winston from "winston";
import axios from "axios";
import express from "express"
import BlockfrostAPI from "./../blockfrost/api.js";
import * as dotenv from "dotenv";
const app = express();
dotenv.config()


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../../package.json`), {encoding: 'utf-8'}));

function Adlace(options={
    port: undefined,
    blockfrostOptions: undefined
}){
    this.options = options;
    this.blockfrost = new BlockfrostAPI(options.blockfrostOptions);
}
Adlace.prototype.getVersion = function (){ return packageJson.version };
Adlace.prototype.runServer = async function (){
    let port = this.options.port;
    return new Promise((res, rej) => {
        try {
            app.get('/', (req, res) => {
                res.send('Hello World!')
            })
            let server = app.listen(port, () => {
                console.log(`The adlace API is listening on port ${port}`);
                res(server);
            })
        } catch (e){
            rej(e)
        }
    })
}
Adlace.prototype.closeServer = async function (server){
    return server.close();
}
Adlace.prototype.getMetadataByAddress = async function(address ,label, qs){
    let utxos = await this.blockfrost.getAddressUTXOs(address);
    let metadataJSONByLabel = await this.blockfrost.getTransactionMetadataContentJSON(label, qs);

    let matches = [];
    utxos.data.forEach(utxo => {
        metadataJSONByLabel.data.forEach(metadata => {
            if(utxo.tx_hash === metadata.tx_hash){
                matches.push({
                    utxo,
                    metadata
                });
            }
        })
    })
    return matches;
}

export default Adlace;