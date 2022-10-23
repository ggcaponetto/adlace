import {useCallback, useEffect, useRef, useState} from "react";
import anime from 'animejs/lib/anime.es.js';
import axios from "axios";
import {
    createBrowserRouter,
    RouterProvider,
    Route, useParams,
} from "react-router-dom";
import sanitizeHtml from 'sanitize-html';
import {Box, Button, Menu, MenuItem, Modal, Typography} from "@mui/material";
import {Buffer} from 'buffer';
let csl = null;

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

function Schema() {
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
                "alias": "something",
                "html": "<div><h2>sometitle</h2><p>a pararagraph</p></div>"
            },
        ]
    }
}
Schema.sanitize = (dirtyInput) => {
    const clean = sanitizeHtml(dirtyInput, {
        allowedTags: [
            "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
            "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
            "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
            "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
            "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
            "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
            "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img"
        ],
        disallowedTagsMode: 'discard',
        allowedAttributes: {
            a: ['href', 'name', 'target'],
            // We don't currently allow img itself by default, but
            // these attributes would make sense if we did.
            img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
        },
        // Lots of these won't come up by default because we don't allow them
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        // URL schemes we permit
        allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel'],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: true,
        enforceHtmlBoundary: false
    });
    return clean;
}

function TXSubmitter(props){
    useEffect(() => {
        async function initCSL(){
            csl = csl || await import("@emurgo/cardano-serialization-lib-browser");
            console.log("The cardano serialization library is ready", csl);
        }
        initCSL();
    }, [])

    const onClick = () => {
        // instantiate the tx builder with the Cardano protocol parameters - these may change later on
        const linearFee = csl.LinearFee.new(
            csl.BigNum.from_str('44'),
            csl.BigNum.from_str('155381')
        );
        const txBuilderCfg = csl.TransactionBuilderConfigBuilder.new()
            .fee_algo(linearFee)
            .pool_deposit(csl.BigNum.from_str('500000000'))
            .key_deposit(csl.BigNum.from_str('2000000'))
            .max_value_size(4000)
            .max_tx_size(8000)
            .coins_per_utxo_word(csl.BigNum.from_str('34482'))
            .build();
        const txBuilder = csl.TransactionBuilder.new(txBuilderCfg);

        const senderAddress = "addr1q8he8j9umc6l5mr68twv5n3cpuwdur087ekeamyknk9l9fwj96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsy4e5mc";
        txBuilder.add_input(
            csl.Address.from_bech32(senderAddress),
            csl.TransactionInput.new(
                csl.TransactionHash.from_bytes(Buffer.from("03ac12cba628f24bbf6de1ce55f0d873b1d06a9552dd9d534967677601beae4b", "hex")), // tx hash
                0, // index
            ),
            csl.Value.new(csl.BigNum.from_str('2000000'))
        );
        const outputAddress = "addr1q9lxxgf4se65sp20zljd3wsyv9tkmwzztsrl5742hyskmswj96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsev2rnu";

        // add output to the tx
        txBuilder.add_output(
            csl.TransactionOutput.new(
                csl.Address.from_bech32(outputAddress),
                csl.Value.new(csl.BigNum.from_str('1400000'))
            ),
        );

        // set the time to live - the absolute slot value before the tx becomes invalid
        // txBuilder.set_ttl(410021);

        // calculate the min fee required and send any change to an address
        txBuilder.add_change_if_needed(
            csl.Address.from_bech32(outputAddress),
        );
        // once the transaction is ready, we build it to get the tx body without witnesses
        const txBody = txBuilder.build();
        const txHash = csl.hash_transaction(txBody);
        const witnesses = csl.TransactionWitnessSet.new();
        console.log("the tx hash is:", {txHash, txBody})
    };
    return (
        <div>
            <Button onClick={onClick}>Submit</Button>
        </div>
    )
}

function NewSpace(props) {
    const [aceEditor, setAceEditor] = useState(null);
    const [sanitized, setSanitized] = useState(null);

    const onRefChange = useCallback(node => {
        if (node === null) {
            // DOM node referenced by ref has been unmounted
        } else {
            // DOM node referenced by ref has changed and exists
            const editor = window.ace.edit("editor", {
                mode: "ace/mode/html",
                selectionStyle: "text"
            });
            editor.setTheme("ace/theme/twilight");
            setAceEditor(editor);
        }
    }, []); // adjust deps
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    useEffect(() => {
       // poll the editor and render a preview
        function getSanitizedValue(){
            const value = aceEditor.getValue();
            const sanitized = Schema.sanitize(value);
            setSanitized(sanitized);
        }
        if(aceEditor){
            aceEditor.session.on("change", getSanitizedValue);
            getSanitizedValue();
        }
        return () => {
            if(aceEditor){
                aceEditor.session.off("change", getSanitizedValue)
            }
        }
    }, [aceEditor]);
    return (
        <Modal
            open={true}
            onClose={props.onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <div>
                    <h4>Raw HTML subset</h4>
                    <div id={"editor"} ref={onRefChange} style={{width: "100%", minHeight: "200px"}}>
                        {`<div>porc</div>`}
                    </div>
                </div>
                <div>
                    <h4>Preview</h4>
                    <div style={{width: "100%", minHeight: "200px"}}>
                        <div dangerouslySetInnerHTML={{__html: sanitized}}/>
                    </div>
                </div>
                <div>
                    <TXSubmitter />
                </div>
            </Box>
        </Modal>
    )
}

function MyMenu(props) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [modal, setModal] = useState(null);

    const handleClose = () => {
        setIsOpen(false)
    };

    const onNewSpace = () => {
        const newModal = (
            <NewSpace onClose={() => {
                setModal(null);
            }}/>
        )
        setModal(newModal);
    }
    return (
        <div ref={c => setAnchorEl(c)}>
            <Button onClick={() => {
                setIsOpen(!isOpen)
            }}>Menu</Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={onNewSpace}>New Space</MenuItem>
                <MenuItem onClick={handleClose}>About</MenuItem>
            </Menu>
            {modal}
        </div>
    )
}

export default function Home(props) {
    const [width, setWidth] = useState(10);
    const [height, setHeight] = useState(0);
    const [containers, setContainers] = useState(null);
    const [transactions, setTransactions] = useState([]);
    let params = useParams();

    useEffect(() => {
        async function getTransactions() {
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
            }).catch(e => {
                console.error(e)
            });
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

    function displaySpace() {
        let transaction = transactions.filter(transaction => transaction.alias === params.alias)[0];
        if (transaction) {
            return (
                <div>
                    <div>
                        {JSON.stringify({
                            transaction, params
                        })}
                    </div>
                    <div dangerouslySetInnerHTML={{__html: Schema.sanitize(transaction.html)}}/>
                </div>
            )
        } else if (params.alias) {
            return (
                <div>
                    404
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
            <div style={{width: "100%"}}>
                <MyMenu/>
            </div>
            {displaySpace()}
        </div>
    )
}