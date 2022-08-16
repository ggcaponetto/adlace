import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';
import winston from "winston";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../../package.json`), {encoding: 'utf-8'}));

// configure the logger
const mochaLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({})
    ]
});

function Blockfrost(options={
    baseUrl: undefined,
    project_id:  undefined
}){
    this.options = options;
}
Blockfrost.prototype.getVersion = function (){packageJson.version};
Blockfrost.prototype.getAddress = async function (address){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}`
    })
};
Blockfrost.prototype.getAddressUTXOs = async function (address){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}/utxos`
    })
};
Blockfrost.prototype.getTransactionMetadataLabels = async function (qs){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels${qs}`
    })
};
Blockfrost.prototype.getTransactionMetadataContentJSON = async function (label, qs){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels/${label}${qs}`
    })
};
export default Blockfrost;