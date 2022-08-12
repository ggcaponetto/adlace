import './App.css';
import qs from 'qs';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
const script = document.currentScript;

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

const getParsedUrl = () => {
  try {
    const url = new URL(script.src);
    const parsedUrl = qs.parse(url.search.substr(1, url.search.length));
    console.info('getParsedUrl', { parsedUrl });
    return parsedUrl;
  } catch (e) {
    console.warn('getParsedUrl', { e });
    throw e;
  }
};
export function run(options = {
                      containerId: getParsedUrl().scriptId
                    }) {
  window.onload = function (){
      console.log("container", options)
    const root = ReactDOM.createRoot(document.getElementById(options.containerId));
      console.log("container", root)
      root.render(
        <Suspense fallback={<div>loading adlace module...</div>}>
          <App />
        </Suspense>,
    );
  }
}
