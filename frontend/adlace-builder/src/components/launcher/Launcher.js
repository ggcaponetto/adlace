import qs from 'qs';
import React, {Suspense, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import * as ll from 'loglevel';
const script = document.currentScript;

if(process.env.NODE_ENV === "production"){
    ll.setLevel(ll.levels.WARN);
} else {
    ll.setLevel(ll.levels.DEBUG);
}

function Launcher() {
    useEffect(() => {
        ll.debug("constructor - Launcher");
    }, []);
    return (
        <div className="Launcher">
            Launcher
        </div>
    );
}
export default Launcher;