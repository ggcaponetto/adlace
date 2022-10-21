import './App.css';
import qs from 'qs';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import i18n (needs to be bundled ;))
import * as i18n from "./components/i18n";
import Home from "./components/home/Home";
import {
    createBrowserRouter,
    RouterProvider,
    Route,
} from "react-router-dom";

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

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home/>,
    },
    {
        path: "/:alias",
        element: <Home/>,
        loader: async ({ request, params }) => {
            return { request, params }
        },

    },
]);

function App() {
  return (
      <ThemeProvider theme={darkTheme}>
          {/* The css baseline adds a black background to the body. We don't want that. */}
          <div className="App" style={{width: "100%", height: "100%"}}>
              <CssBaseline />
              <RouterProvider router={router} />
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
