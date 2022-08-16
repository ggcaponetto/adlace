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

function Schema(){
    this.versions = [
        {
            version: 1,
        }
    ]
}
Schema.prototype.getLatest = function (){  }