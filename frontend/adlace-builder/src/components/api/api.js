import axios from "axios";

function API(options) {
    this.options = options;
}

API.prototype.getSchema = async function () {
    return axios({
        method: "get",
        url: `${this.options.baseUrl}/schema`
    });
}
API.prototype.getOptions = function () {
    return this.options;
}
API.prototype.getMetadata = function (qs) {
    return axios({
        method: "get",
        url: `${this.options.baseUrl}/metadata${qs}`
    });
}
export default API;