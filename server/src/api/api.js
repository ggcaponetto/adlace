import fs from "fs";
import path from "path"
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let packageJson = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../../package.json`), {encoding: 'utf-8'}));


function API(options={}){
    this.options = options;
}
API.prototype.getVersion = () => packageJson.version;

export default API;