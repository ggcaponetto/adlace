import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';
import winston from "winston";
import axios from "axios";
import express from "express"
const app = express();
const port = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../../package.json`), {encoding: 'utf-8'}));

function API(options={
    port: port
}){
    this.options = options;
}
API.prototype.getVersion = function (){ return packageJson.version };
API.prototype.runServer = async function (){
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
API.prototype.closeServer = async function (server){
    return server.close();
}
export default API;