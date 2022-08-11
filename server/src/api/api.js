import * as packageJson from "../../package.json"

function API(options={}){
    this.options = options;
}
API.prototype.getVersion = () => packageJson.version;

export default API;