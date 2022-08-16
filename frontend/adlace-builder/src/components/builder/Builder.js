import qs from 'qs';
import React, {Suspense, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import * as ll from "loglevel";
import {useTranslation} from "react-i18next";
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
            Builder: {t('Welcome to React')}
        </div>
    );
}
export default Builder;