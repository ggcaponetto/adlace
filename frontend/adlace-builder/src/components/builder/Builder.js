import qs from 'qs';
import React, {Suspense, useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import * as ll from "loglevel";
import {useTranslation} from "react-i18next";

import Button from '@mui/material/Button';
import API from "../api/api";


const script = document.currentScript;
if(process.env.NODE_ENV === "production"){
    ll.setLevel(ll.levels.WARN);
} else {
    ll.setLevel(ll.levels.DEBUG);
}
const api = new API({
    baseUrl: process.env.REACT_APP_API_BASEURL
})

function AdSubmitter(props){
    const [wallets, setWallets] = useState([]);
    const [pollCount, setPollCount] = useState(0);

    const pollWallets = (options) => {
        const wallets = [];
        for(const key in window.cardano) {
            if (window.cardano[key].enable && wallets.indexOf(key) === -1) {
                wallets.push(key);
            }
        }

        if (wallets.length === 0 && options.count < options.maxCount) {
            setTimeout(() => {
                setPollCount((p) => {
                    pollWallets( {
                        ...options,
                        count: p + 1,
                    });
                    return p + 1;
                });
            }, options.interval);
        }
        setWallets(wallets);
    }
    const enable = async (walletName) => {
        let walletIsEnabled = false;
        try {
            walletIsEnabled = await window.cardano[walletName].isEnabled();
        } catch (err) {
            console.log(err)
        }
        if(walletIsEnabled){
            return Promise.resolve(`wallet ${walletName} is enabled`);
        } else {
            try {
                return await window.cardano[walletName].enable();
            } catch(err) {
                console.log(err);
                return Promise.reject(err)
            }
        }
    }
    return (
        <div className={"AdSubmitter"}>
            <Button onClick={() => {
                pollWallets({
                    count: 0, maxCount: 3, interval: 1000
                });
            }}>
                poll wallets
            </Button>
            wallets: {wallets.join(",")}, pollCount: {pollCount}
            <Button onClick={async () => {
                let connection = await enable("eternl");
                console.info("wallet connection status: ", connection)
            }}>
                enable
            </Button>
        </div>
    )
}

function Builder() {
    const [t, i18n] = useTranslation();
    const [data, setData] = useState(null);

    const update = async () => {
        let schemaResponse = await api.getSchema();
        let options = api.getOptions();
        let address = "addr1qx5hcvf9fhurwcmpp49ktppgy2eyeydd56mr05caa6xmfa7j96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsuu8g2m";
        let metadata = await api.getMetadata(`?count=5&page=1&order=desc&address=${address}&label=55555`)
        setData({
            schema: schemaResponse.data, options, metadata
        })
    }

    useEffect(() => {
        ll.debug("constructor - Builder");
    }, []);

    return (
        <div className="Builder">
            <div>Builder</div>
            <div>
                locize: {t('Welcome to React')}
            </div>
            <div>
                env: {process.env.REACT_APP_API_BASEURL}
            </div>
            <div>
                data: {JSON.stringify(data?.metadata)}
            </div>
            <Button variant="contained" onClick={async ()=>{await update()}}>Get Data</Button>
            <AdSubmitter />
        </div>
    );
}
export default Builder;