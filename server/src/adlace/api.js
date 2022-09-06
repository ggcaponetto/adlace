import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';
import winston from "winston";
import axios from "axios";
import express from "express"
import BlockfrostAPI from "./../blockfrost/api.js";
import * as dotenv from "dotenv";
import Schema from "./schema.js";
import cors from "cors"
import querystring from "node:querystring"
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
    let schema = new Schema();
    let context = this;
    return new Promise(function (res, rej) {
        try {
            app.use(cors())
            app.get('/schema', (req, res) => {
                let latestSchema = schema.getLatest();
                res.json(latestSchema);
            })
            app.get('/metadata', async (req, res) => {
                let metadata = await Adlace.prototype.getMetadataByAddress.call(
                    context,
                    req.query.address,
                    req.query.label,
                    `?count=${req.query.count}&page=${req.query.page}&order=${req.query.order}`
                );
                res.json(metadata);
            })
            app.get('/bf/blocks/latest', async (req, res) => {
                let response = await context.blockfrost.getLatestBlock();
                res.json(response.data);
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
    /*
    * There could be a lot of labels, paginate them all.
    * */
    let metadataJSONByLabels = [];
    let isPaginating = true;
    let parsedQs = querystring.parse(qs.substring(1, qs.length));
    let paginateCount = 0;
    while(isPaginating){
        paginateCount = paginateCount + 1;
        parsedQs.page = paginateCount;
        let tempLabels = await this.blockfrost.getTransactionMetadataContentJSON(label, `?${querystring.encode(parsedQs)}`);
        metadataJSONByLabels = metadataJSONByLabels.concat(tempLabels.data);
        isPaginating = tempLabels.data.length === parseInt(parsedQs.count);
    }

    let matches = [];
    utxos.data.forEach(utxo => {
        metadataJSONByLabels.forEach(metadata => {
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