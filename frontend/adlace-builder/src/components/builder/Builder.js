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
        setData({
            schema: schemaResponse.data, options
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
                data: {JSON.stringify(data)}
            </div>
            <Button variant="contained" onClick={async ()=>{await update()}}>Get Data</Button>
        </div>
    );
}
export default Builder;