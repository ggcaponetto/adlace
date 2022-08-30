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
        </div>
    );
}
export default Builder;