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
import Dandelion from "../api/dandelion";
// import * as messageSigning from "../../lib/message-signing/pkg/cardano_message_signing.js"
let dandelionApi = new Dandelion();
let csl = null;
let messageSigning = null;
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
        async function initMessageSigning(){
            messageSigning = messageSigning || await import("../../lib/message-signing/pkg/cardano_message_signing");
            console.log("The cardano message signing library is ready", messageSigning);
        }
        initCSL();
        initMessageSigning();
    }, [])

    const onClick = async () => {
        // https://developers.cardano.org/docs/get-started/cardano-serialization-lib/create-react-app/#troubleshooting
        // initialize the wallet
        let wallet = await window.cardano["eternl"].enable();

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
                csl.TransactionHash.from_bytes(Buffer.from("38a9e41f3d31baa8bdaee4c301c2f3c98c63a2b12e281a4339b014550be2f166", "hex")), // tx hash
                1, // index
            ),
            csl.Value.new(csl.BigNum.from_str('15423557'))
        );
        const outputAddress = "addr1q9lxxgf4se65sp20zljd3wsyv9tkmwzztsrl5742hyskmswj96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsev2rnu";

        // add output to the tx
        txBuilder.add_output(
            csl.TransactionOutput.new(
                csl.Address.from_bech32(outputAddress),
                csl.Value.new(csl.BigNum.from_str('1400000'))
            ),
        );

        let latestSlotResponse = await dandelionApi.getLatestSlots();
        console.log("the latest slot number is:", {latestSlotResponse});
        let latestSlotNumber = latestSlotResponse.data.data.blocks[0].slotNo;
        txBuilder.set_ttl(latestSlotNumber + 60 * 5 );

        // ad metadata
        const metadataObject = {
            cco: "zio",
            comment: "hey macarena",
        };
        txBuilder.add_json_metadatum(csl.BigNum.from_str("55555"), JSON.stringify(metadataObject));

        // calculate the min fee required and send any change to an address (last step)
        txBuilder.add_change_if_needed(
            csl.Address.from_bech32(outputAddress),
        );

        // once the transaction is ready, we build it to get the tx body without witnesses
        const txBody = txBuilder.build();
        const txHash = csl.hash_transaction(txBody);
        const transactionWitnessSet  = csl.TransactionWitnessSet.new();
        console.log("the tx hash is:", {txHash, txBody});


        const unsignedTx = txBuilder.build_tx();
        const tx = csl.Transaction.new(
            txBody,
            csl.TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes()),
            unsignedTx.auxiliary_data()
        )

        let txVkeyWitnesses = await wallet.signTx(
            Buffer.from(
                tx.to_bytes(), "utf8"
            ).toString("hex"),
            true
        );

        txVkeyWitnesses = csl.TransactionWitnessSet.from_bytes(
            Buffer.from(txVkeyWitnesses, "hex")
        );

        transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

        const signedTx = csl.Transaction.new(
            tx.body(),
            transactionWitnessSet,
            unsignedTx.auxiliary_data()
        );
        console.log("the signed tx is:", {signedTx});

        const submittedTxHash = await wallet.submitTx(
            Buffer.from(
                signedTx.to_bytes(), "utf8"
            ).toString("hex")
        );
        console.log("the signed tx has been submitted:", {submittedTxHash});
    };
    const onSign = async () => {
        let wallet = await window.cardano["eternl"].enable();
        let usedAddresses = await wallet.getUsedAddresses();
        let decodedUsedAddresses = usedAddresses.map(encodedAddress => csl.Address.from_bytes(Buffer.from(encodedAddress, "hex")).to_bech32());
        console.log("Used addresses", {
            decodedUsedAddresses, usedAddresses
        });
        const toHex = str => {
            let hex = ''
            for (let i = 0, l = str.length; i < l; i++) {
                hex += str.charCodeAt(i).toString(16)
            }
            return hex
        };
        // let signedData = await wallet.signData(decodedUsedAddresses[0], toHex(JSON.stringify({"some": "data"})))
        /*
        sample: {"signature":"844fa20127676164647265737343ad0d01a166686173686564f44f7b22736f6d65223a2264617461227d584087c626eb8320b86ea2146afc845ebba12917ffb0b2b9e7eaed005d43b783a9d2de2c5d7fccc1a88ad6310d9adb50a8e3ae14ad8dd442877d5c413f6cb9b2a306","key":"a4010103272006215820b079c83b0bd317ff0bd7c7cf1e08859a70f8806c16e314373f922a8fe7739115"}
        */
        const signedData = JSON.parse("{\"signature\":\"844fa20127676164647265737343ad0d01a166686173686564f44f7b22736f6d65223a2264617461227d584087c626eb8320b86ea2146afc845ebba12917ffb0b2b9e7eaed005d43b783a9d2de2c5d7fccc1a88ad6310d9adb50a8e3ae14ad8dd442877d5c413f6cb9b2a306\",\"key\":\"a4010103272006215820b079c83b0bd317ff0bd7c7cf1e08859a70f8806c16e314373f922a8fe7739115\"}")
        console.log("Signed data", {
            signedData,
            messageSigning
        });
        const coseKey = messageSigning.COSEKey.from_bytes(Buffer.from(signedData.key, 'hex'));
        const keyHeaderBytes = coseKey.header(messageSigning.Label.new_int(messageSigning.Int.new_i32(-2))).as_bytes();
        console.log("Parsed COSE key and headers", {
            coseKey,
            keyHeaderBytes
        });
    }
    return (
        <div>
            <Button onClick={onClick}>Submit</Button>
            <Button onClick={onSign}>Sign Data</Button>
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
                        {`<div>test</div>`}
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
            let transactionsResponse = await dandelionApi.getTransactions();
            console.log("got transactions", transactionsResponse);
            // setTransactions(transactionsResponse.data.data.transactions);
            // moch the transactions
            setTransactions(Schema.getSamples()["1.0.0"]);
            setHeight(Math.floor(transactionsResponse.data.data.transactions.length / width));
        }

        getTransactions();
    }, [])

    useEffect(() => {
        console.log("params", params);
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
                justifyContent: "center"
            }}>
            <div style={{width: "100%"}}>
                <MyMenu/>
            </div>
            {/*{displaySpace()}*/}
        </div>
    )
}