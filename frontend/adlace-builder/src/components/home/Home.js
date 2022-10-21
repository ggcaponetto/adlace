import {useEffect, useState} from "react";
import anime from 'animejs/lib/anime.es.js';
import axios from "axios";
import {
    createBrowserRouter,
    RouterProvider,
    Route, useParams,
} from "react-router-dom";

function Advertisement(props) {
    const states = {
        DISPLAY: "DISPLAY",
        BLUR: "BLUR",
        BACK: "BACK",
    }
    const [state, setState] = useState(states.DISPLAY);
    const [timeline, setTimeline] = useState(anime.timeline({
        easing: 'easeOutExpo',
        duration: 750
    }));

    function onClick() {
        let target = window.document.querySelector(`.advertisement_${props.coordinates.x}_${props.coordinates.y}`);
        timeline.add({
            targets: `.cell_${props.coordinates.x}_${props.coordinates.y}`,
            rotate: "1turn",
            backgroundColor: '#FFFFFF',
            duration: 2000
        });
        if (state === states.DISPLAY) {
            setState(states.BACK)
        } else if (state === states.BACK) {
            setState(states.DISPLAY)
        }
    }

    return (
        <div className={`advertisement advertisement_${props.coordinates.x}_${props.coordinates.y} state_${state}`}
             onClick={onClick}>
            {props.children}
        </div>
    )
}

function Schema(){
}
Schema.getSamples = () => {
    return {
        "1.0.0": [
            {
                "coordinates": {x: 0, y: 0},
                "alias": "somename"
            },
            {
                "coordinates": {x: 1, y: 0},
                "alias": "something"
            },
        ]
    }
}

export default function Home(props) {
    const [width, setWidth] = useState(10);
    const [height, setHeight] = useState(0);
    const [containers, setContainers] = useState(null);
    const [transactions, setTransactions] = useState([]);
    let params = useParams();

    useEffect(() => {
        async function getTransactions(){
            console.log("fetching transactions...")
            let transactionsResponse = await axios({
                method: 'post',
                url: 'https://graphql-api.mainnet.dandelion.link',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify({
                    query: `{ 
                transactions(
                    limit: 1000
                    where: {metadata: {key: { _eq: "721"}}}
                    order_by: {
                        includedAt: desc
                    }
                ) {
                     blockIndex
                     includedAt
                     metadata {
                         key
                         value
                     }
                     hash
                }
            }`,
                    variables: {}
                })
            }).catch(e => { console.error(e) });
            console.log("got transactions", transactionsResponse);
            // setTransactions(transactionsResponse.data.data.transactions);
            // moch the transactions
            setTransactions(Schema.getSamples()["1.0.0"]);
            setHeight(Math.floor(transactionsResponse.data.data.transactions.length / width));
        }
        getTransactions();
    }, [])

    useEffect(() => {
        console.log("params", params)
    }, [])

    useEffect(() => {
        function setGrid() {
            let topContainer = window.document.getElementById("top-container");
            let containers = [];
            Array(height).fill(0).map((val, i) => i).forEach((heightPosition) => {
                const row = [];
                Array(width).fill(0).map((val, i) => i).forEach((widthPosition) => {
                    // console.log(`constructing spot: ${widthPosition} x ${heightPosition}`);
                    let randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    const style = {
                        minWidth: `${10}px`,
                        width: `${(topContainer.clientWidth / width)}px`,
                        minHeight: `${10}px`,
                        height: `${(topContainer.clientWidth / width)}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `#${randomColor}`,
                        fontSize: `0.5em`
                    }
                    row.push(
                        <Advertisement
                            key={`${widthPosition}_${heightPosition}`}
                            coordinates={{
                                x: widthPosition,
                                y: heightPosition
                            }}
                            originalStyle={style}
                        >
                            <div
                                className={`col_${widthPosition} cell cell_${widthPosition}_${heightPosition}`}
                                style={style}
                            >
                                {`x: ${widthPosition} y: ${heightPosition}`}
                            </div>
                        </Advertisement>
                    );
                });
                containers.push((
                    <div key={`key_${heightPosition}`} className={`row_${heightPosition}`} style={{
                        display: "flex",
                        flexDirection: "row"
                    }}>
                        {row}
                    </div>
                ))
            });
            setContainers(containers);
        }

        setGrid();
        window.addEventListener("resize", setGrid);
    }, [height])

    function displaySpace(){
        let transaction = transactions.filter(transaction => transaction.alias === params.alias)[0];
        if(transaction){
            return (
                <div>
                    {JSON.stringify({
                        transaction, params
                    })}
                </div>
            )
        } else {
            return containers || "No Spaces"
        }
    }
    return (
        <div
            id={"top-container"}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center"
            }}>
            {displaySpace()}
        </div>
    )
}