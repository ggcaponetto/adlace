import qs from 'qs';
import React, {Suspense, useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import * as ll from "loglevel";
import {useTranslation} from "react-i18next";

import Button from '@mui/material/Button';
import API from "../api/api";
import {
    Address,
    BaseAddress,
    MultiAsset,
    Assets,
    ScriptHash,
    Costmdls,
    Language,
    CostModel,
    AssetName,
    TransactionUnspentOutput,
    TransactionUnspentOutputs,
    TransactionOutput,
    Value,
    TransactionBuilder,
    TransactionBuilderConfigBuilder,
    TransactionOutputBuilder,
    LinearFee,
    BigNum,
    BigInt,
    TransactionHash,
    TransactionInputs,
    TransactionInput,
    TransactionWitnessSet,
    Transaction,
    PlutusData,
    PlutusScripts,
    PlutusScript,
    PlutusList,
    Redeemers,
    Redeemer,
    RedeemerTag,
    Ed25519KeyHashes,
    ConstrPlutusData,
    ExUnits,
    Int,
    NetworkInfo,
    EnterpriseAddress,
    TransactionOutputs,
    hash_transaction,
    hash_script_data,
    hash_plutus_data,
    ScriptDataHash,
    Ed25519KeyHash,
    NativeScript,
    StakeCredential,
    TransactionMetadatumLabels,
    TransactionMetadatum,
    GeneralTransactionMetadata,
    AuxiliaryData
} from "@emurgo/cardano-serialization-lib-asmjs"
import * as CSL from "@emurgo/cardano-serialization-lib-asmjs";
import BufferLib from "buffer/index";
import axios from "axios";

const Buffer = BufferLib.Buffer;


const script = document.currentScript;
if (process.env.NODE_ENV === "production") {
    ll.setLevel(ll.levels.WARN);
} else {
    ll.setLevel(ll.levels.DEBUG);
}
const api = new API({
    baseUrl: process.env.REACT_APP_API_BASEURL
})

function AdSubmitter(props) {
    const [wallets, setWallets] = useState([]);
    const [pollCount, setPollCount] = useState(0);
    const [protocolParams, setProtocolParams] = useState({
        linearFee: {
            minFeeA: "44",
            minFeeB: "155381",
        },
        minUtxo: "34482",
        poolDeposit: "500000000",
        keyDeposit: "2000000",
        maxValSize: 5000,
        maxTxSize: 16384,
        priceMem: 0.0577,
        priceStep: 0.0000721,
        coinsPerUtxoWord: "34482",
    })
    const pollWallets = (options) => {
        const wallets = [];
        for (const key in window.cardano) {
            if (window.cardano[key].enable && wallets.indexOf(key) === -1) {
                wallets.push(key);
            }
        }

        if (wallets.length === 0 && options.count < options.maxCount) {
            setTimeout(() => {
                setPollCount((p) => {
                    pollWallets({
                        ...options,
                        count: p + 1,
                    });
                    return p + 1;
                });
            }, options.interval);
        }
        setWallets(wallets);
    }
    const enable = async (walletName) => {
        try {
            return await window.cardano[walletName].enable();
        } catch (err) {
            console.log(err);
            return Promise.reject(err.message)
        }
    }
    const initTransactionBuilder = async () => {
        const txBuilder = TransactionBuilder.new(
            TransactionBuilderConfigBuilder.new()
                .fee_algo(LinearFee.new(BigNum.from_str(protocolParams.linearFee.minFeeA), BigNum.from_str(protocolParams.linearFee.minFeeB)))
                .pool_deposit(BigNum.from_str(protocolParams.poolDeposit))
                .key_deposit(BigNum.from_str(protocolParams.keyDeposit))
                .coins_per_utxo_word(BigNum.from_str(protocolParams.coinsPerUtxoWord))
                .max_value_size(protocolParams.maxValSize)
                .max_tx_size(protocolParams.maxTxSize)
                .prefer_pure_change(true)
                .build()
        );
        return txBuilder
    }
    const getUtxos = async (connection) => {
        let Utxos = [];
        try {
            const rawUtxos = await connection.getUtxos();
            for (const rawUtxo of rawUtxos) {
                const utxo = TransactionUnspentOutput.from_bytes(Buffer.from(rawUtxo, "hex"));
                const input = utxo.input();
                const txid = Buffer.from(input.transaction_id().to_bytes(), "utf8").toString("hex");
                const txindx = input.index();
                const output = utxo.output();
                const amount = output.amount().coin().to_str(); // ADA amount in lovelace
                const multiasset = output.amount().multiasset();
                let multiAssetStr = "";
                if (multiasset) {
                    const keys = multiasset.keys() // policy Ids of thee multiasset
                    const N = keys.len();
                    // console.log(`${N} Multiassets in the UTXO`)


                    for (let i = 0; i < N; i++) {
                        const policyId = keys.get(i);
                        const policyIdHex = Buffer.from(policyId.to_bytes(), "utf8").toString("hex");
                        // console.log(`policyId: ${policyIdHex}`)
                        const assets = multiasset.get(policyId)
                        const assetNames = assets.keys();
                        const K = assetNames.len()
                        // console.log(`${K} Assets in the Multiasset`)

                        for (let j = 0; j < K; j++) {
                            const assetName = assetNames.get(j);
                            const assetNameString = Buffer.from(assetName.name(), "utf8").toString();
                            const assetNameHex = Buffer.from(assetName.name(), "utf8").toString("hex")
                            const multiassetAmt = multiasset.get_asset(policyId, assetName)
                            multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`
                            // console.log(assetNameString)
                            // console.log(`Asset Name: ${assetNameHex}`)
                        }
                    }
                }
                const obj = {
                    txid: txid,
                    txindx: txindx,
                    amount: amount,
                    str: `${txid} #${txindx} = ${amount}`,
                    multiAssetStr: multiAssetStr,
                    TransactionUnspentOutput: utxo
                }
                Utxos.push(obj);
            }
            return Utxos;
        } catch (err) {
            console.log(err)
        }
    }

    const getTxUnspentOutputs = async (connection) => {
        let txOutputs = TransactionUnspentOutputs.new();
        let utxos = await getUtxos(connection);
        for (const utxo of utxos) {
            txOutputs.add(utxo.TransactionUnspentOutput)
        }
        return txOutputs;
    }
    const buildSendADA = async (outputAddress, changeAddress, amountLovelace, connection) => {
        const txBuilder = await initTransactionBuilder();
        const shelleyOutputAddress = Address.from_bech32(outputAddress);
        const shelleyChangeAddress = Address.from_bech32(changeAddress);

        txBuilder.add_output(
            TransactionOutput.new(
                shelleyOutputAddress,
                Value.new(BigNum.from_str(amountLovelace.toString()))
            ),
        );


        // Find the available UTXOs in the wallet and
        // us them as Inputs
        const txUnspentOutputs = await getTxUnspentOutputs(connection);
        /* Strategies:
          LargestFirst: 0
          RandomImprove: 1
          LargestFirstMultiAsset: 2
          RandomImproveMultiAsset: 3
        */
        txBuilder.add_inputs_from(txUnspentOutputs, 0)

        let label = BigNum.from_str("5555");
        let jsonValue = JSON.stringify({what: "if", a: 666});

        // let value = TransactionMetadatum.new_text(jsonValue);
        // let generalTransactionMetadata = GeneralTransactionMetadata.new();
        // generalTransactionMetadata.insert(key, value);

        // const auxiliaryData = AuxiliaryData.new();
        // auxiliaryData.set_metadata(generalTransactionMetadata);
        // txBuilder.set_auxiliary_data(auxiliaryData);
        txBuilder.add_json_metadatum(label, jsonValue)


        let currentSlotResponse = await api.getLatestBlock();
        let ttl = currentSlotResponse.data.slot + 7200;
        txBuilder.set_ttl(ttl); // now + 2h

        // calculate the min fee required and send any change to an address (last thing to do)
        txBuilder.add_change_if_needed(shelleyChangeAddress)

        // Tx witness
        const transactionWitnessSet = TransactionWitnessSet.new();

        const tx = Transaction.new(
            txBuilder.build(),
            TransactionWitnessSet.new(),
            txBuilder.get_auxiliary_data()
        )

        const encodedTx = Buffer.from(tx.to_bytes()).toString("hex");
        let txVkeyWitnesses = await connection.signTx(encodedTx, false);
        txVkeyWitnesses = TransactionWitnessSet.from_bytes(Buffer.from(txVkeyWitnesses, "hex"));

        transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());


        // re-assemble signed transaction
        const signedTx = Transaction.new(
            tx.body(),
            // TransactionWitnessSet.from_bytes(witnessSet.to_bytes()),
            // TransactionWitnessSet.from_hex(Buffer.from(witnessSet.to_bytes()).toString("hex")),
            transactionWitnessSet,
            tx.auxiliary_data()
        );

        // encode signed transaction
        const encodedSignedTx = Buffer.from(signedTx.to_bytes()).toString("hex");

        const submittedTxHash = await connection.submitTx(encodedSignedTx);
        console.log(submittedTxHash)
        return submittedTxHash;
    }
    return (
        <div className={"AdSubmitter"}>
            <Button onClick={() => {
                pollWallets({
                    count: 0, maxCount: 3, interval: 1000
                });
            }}>
                poll wallets
            </Button>
            wallets: {wallets.join(",")}, pollCount: {pollCount}
            <Button onClick={async () => {
                let connectionResponse = await enable("eternl").catch(e => e);
                console.info("wallet connection status: ", connectionResponse);
                let utxos = await getTxUnspentOutputs(connectionResponse);
                console.info("got utxos: ", utxos);
            }}>
                enable
            </Button>
            <Button onClick={async () => {
                let connectionResponse = await enable("eternl").catch(e => e);
                let sendResponse = await buildSendADA(
                    "addr1q83wrhyv2m6xhm66wzu0ej8gvg9663k6h4qhqktcw6fee7xj96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpser6yxs",
                    "addr1qx5hcvf9fhurwcmpp49ktppgy2eyeydd56mr05caa6xmfa7j96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsuu8g2m",
                    3000000,
                    connectionResponse
                ).catch(e => {
                    console.info("ada not sent: ", e);
                });
                console.info("sent ada: ", sendResponse);
            }}>
                send ada
            </Button>
        </div>
    )
}

function Builder() {
    const [t, i18n] = useTranslation();
    const [data, setData] = useState(null);

    const update = async () => {
        let schemaResponse = await api.getSchema();
        let options = api.getOptions();
        let address = "addr1qx5hcvf9fhurwcmpp49ktppgy2eyeydd56mr05caa6xmfa7j96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsuu8g2m";
        let metadata = await api.getMetadata(`?count=5&page=1&order=desc&address=${address}&label=55555`)
        setData({
            schema: schemaResponse.data, options, metadata
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
                data: {JSON.stringify(data?.metadata)}
            </div>
            <Button variant="contained" onClick={async () => {
                await update()
            }}>Get Data</Button>
            <AdSubmitter/>
        </div>
    );
}

export default Builder;