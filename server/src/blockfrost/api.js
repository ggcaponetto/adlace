import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';
import winston from "winston";
import axios from "axios";

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

function API(options={
    baseUrl: "https://cardano-mainnet.blockfrost.io",
    project_id:  process.env.BLOCKFROST_MAINNET
}){
    this.options = options;
}
API.prototype.getVersion = function (){packageJson.version};
API.prototype.getAddress = async function (address){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}`
    })
};
API.prototype.getAddressUTXOs = async function (address){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}/utxos`
    })
};
API.prototype.getTransactionMetadataLabels = async function (qs){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels${qs}`
    })
};
API.prototype.getTransactionMetadataContentJSON = async function (label, qs){
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels/${label}${qs}`
    })
};
export default API;