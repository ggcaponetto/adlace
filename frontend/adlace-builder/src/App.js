import './App.css';
import qs from 'qs';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Builder from "./components/builder/Builder";
import Launcher from "./components/launcher/Launcher";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
const script = document.currentScript;

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});
const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
  return (
      <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <div className="App">
              <Builder/>
              <Launcher/>
          </div>
      </ThemeProvider>
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
