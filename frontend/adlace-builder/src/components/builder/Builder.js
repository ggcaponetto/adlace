import qs from 'qs';
import React, {Suspense, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import * as ll from "loglevel";
import {useTranslation} from "react-i18next";

import Button from '@mui/material/Button';


const script = document.currentScript;
if(process.env.NODE_ENV === "production"){
    ll.setLevel(ll.levels.WARN);
} else {
    ll.setLevel(ll.levels.DEBUG);
}
function Builder() {
    const [t, i18n] = useTranslation();
    useEffect(() => {
        ll.debug("constructor - Builder");
    }, []);
    return (
        <div className="Builder">
            Builderrr: {t('Welcome to React')}
            <Button variant="contained">Hello World</Button>
        </div>
    );
}
export default Builder;