import Adlace from "./adlace/api.js";
import * as dotenv from "dotenv";
dotenv.config()


let api = new Adlace({
    port: process.env.PORT,
    blockfrostOptions: {
        baseUrl: "https://cardano-mainnet.blockfrost.io",
        project_id: process.env.BLOCKFROST_MAINNET
    }
});
let server = await api.runServer();