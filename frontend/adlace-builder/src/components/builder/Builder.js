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
    AuxiliaryData,
    NativeScripts
} from "@emurgo/cardano-serialization-lib-asmjs"
import * as CSL from "@emurgo/cardano-serialization-lib-asmjs";
// import BufferLib from "buffer/index";
import axios from "axios";
import * as bip39 from 'bip39';
import {Transform} from "stream";

global.Transform = Transform;
/*const Buffer = BufferLib.Buffer;
window.Buffer = Buffer;*/

const Bech32Prefix = Object.freeze({
    ADDRESS: 'addr',
    PAYMENT_KEY_HASH: 'addr_vkh',
});

export function bytesToHex(bytes) {
    return Buffer.from(bytes).toString('hex');
}

export function hexToBytes(hex) {
    return Buffer.from(hex, 'hex');
}

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
    const buildSendADA = async (outputAddress, changeAddress, nftReceiverAddress, amountLovelace, connection) => {
        const txBuilder = await initTransactionBuilder();
        const shelleyOutputAddress = Address.from_bech32(outputAddress);
        const shelleyChangeAddress = Address.from_bech32(changeAddress);

        const keyHash = CSL.BaseAddress.from_address(CSL.Address.from_bech32(changeAddress))
            .payment_cred()
            .to_keyhash();

        const keyHashBech = keyHash.to_bech32(Bech32Prefix.PAYMENT_KEY_HASH);

        txBuilder.add_output(
            TransactionOutput.new(
                shelleyOutputAddress,
                Value.new(BigNum.from_str(amountLovelace.toString()))
            ),
        );

        const scripts = CSL.NativeScripts.new();
        scripts.add(CSL.NativeScript.new_script_pubkey(CSL.ScriptPubkey.new(keyHash)));
        scripts.add(CSL.NativeScript.new_timelock_start(CSL.TimelockStart.new(42)));

        const mintScript = CSL.NativeScript.new_script_all(CSL.ScriptAll.new(scripts));
        const mintScriptHex = bytesToHex(mintScript.to_bytes());

        function convertAssetNameToHEX(name) {
            return bytesToHex(name);
        }

        const tokenAssetName = 'V42';
        const nftAssetName = `V42/NFT#${Math.floor(Math.random() * 1000000000)}`;
        const tokenAssetNameHex = convertAssetNameToHEX(tokenAssetName);
        const nftAssetNameHex = convertAssetNameToHEX(nftAssetName);

        const expectedPolicyId = bytesToHex(mintScript.hash().to_bytes());

        console.log('[createTx] Including mint request: ', {
            keyHashBech,
            mintScriptHex,
            assetNameHex: tokenAssetNameHex,
            expectedPolicyId,
        });


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

        /*let label = BigNum.from_str("5555");
        let jsonValue = JSON.stringify({what: "if", a: 666});*/

        /*const auxiliaryData = AuxiliaryData.new();
        txBuilder.set_auxiliary_data(auxiliaryData);
        txBuilder.add_json_metadatum(label, jsonValue);*/

        const metadata = {
            [expectedPolicyId]: {
                [nftAssetName]: {
                    name: nftAssetName,
                    description: `some description of ${nftAssetName}`,
                    image: "ipfs://QmNhmDPJMgdsFRM9HyiQEJqrKkpsWFshqES8mPaiFRq9Zk",
                    mediaType: "image/jpeg",
                },
            },
        };
        txBuilder.add_json_metadatum(
            CSL.BigNum.from_str("721"),
            JSON.stringify(metadata)
        );

        let currentSlotResponse = await api.getLatestBlock();
        let ttl = currentSlotResponse.data.slot + 7200;
        txBuilder.set_ttl(ttl); // now + 2h

        txBuilder.add_mint_asset_and_output_min_required_coin(
            mintScript,
            CSL.AssetName.new(Buffer.from(tokenAssetName)),
            CSL.Int.new_i32(1),
            CSL.TransactionOutputBuilder.new().with_address(CSL.Address.from_bech32(nftReceiverAddress)).next()
        );

        // calculate the min fee required and send any change to an address (last thing to do)
        txBuilder.add_change_if_needed(shelleyChangeAddress)

        // Tx witness

        // once the transaction is ready, we build it to get the tx body without witnesses
        const txBody = txBuilder.build();
        const txHash = CSL.hash_transaction(txBody);
        const witnesses = CSL.TransactionWitnessSet.new();
        const witnessScripts = CSL.NativeScripts.new();

        console.log(`TX_HASH: ${Buffer.from(txHash.to_bytes()).toString("hex")}`);

        const unsignedTx = txBuilder.build_tx();

        // create signed transaction
        const tx = CSL.Transaction.new(
            unsignedTx.body(),
            witnesses,
            unsignedTx.auxiliary_data()
        );

        const encodedTx = Buffer.from(tx.to_bytes()).toString("hex");

        let txVkeyWitnesses = await connection.signTx(encodedTx);
        txVkeyWitnesses = TransactionWitnessSet.from_bytes(Buffer.from(txVkeyWitnesses, "hex"));
        witnesses.set_vkeys(txVkeyWitnesses.vkeys());
        witnessScripts.add(mintScript);
        witnesses.set_native_scripts(witnessScripts);


        // re-assemble signed transaction
        const signedTx = Transaction.new(
            txBody,
            witnesses,
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
                    "addr1q9lxxgf4se65sp20zljd3wsyv9tkmwzztsrl5742hyskmswj96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsev2rnu",
                    5000000,
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

function Blockfrost(options = {
    baseUrl: process.env.REACT_APP_BLOCKFROST_BASE_URL_KEY,
    project_id: process.env.REACT_APP_BLOCKFROST_API_KEY
}) {
    this.options = options;
}
Blockfrost.prototype.getProtocolParameters = async function (epoch) {
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/epochs/${epoch}/parameters`
    })
};
Blockfrost.prototype.getAddress = async function (address) {
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}`
    })
};
Blockfrost.prototype.getAddressUTXOs = async function (address) {
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/addresses/${address}/utxos`
    })
};
Blockfrost.prototype.getTransactionMetadataLabels = async function (qs) {
    return axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels${qs}`
    })
};
Blockfrost.prototype.getTransactionMetadataContentJSON = async function (label, qs) {
    return await axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/metadata/txs/labels/${label}${qs}`
    })
        .then(res => {
            return res;
        }).catch(e => {
            console.error(e);
        })
};
Blockfrost.prototype.getLatestBlock = async function () {
    return await axios({
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "project_id": this.options.project_id
        },
        url: `${this.options.baseUrl}/api/v0/blocks/latest`
    })
        .then(res => {
            return res;
        }).catch(e => {
            console.error(e);
        })
};

export function NewBuilder() {
    const [lines, setLines] = useState([
        <h2>tx builder (using blockfrost: {process.env.REACT_APP_BLOCKFROST_API_KEY})</h2>
    ]);

    const log = line => setLines(p => {
        return [...p, line];
    });
    function harden(num) {
        return 0x80000000 + num;
    }
    useEffect( () => {
        const buildNFT = async () => {
            // collect data from the blockfrost backend
            const blockfrost = new Blockfrost({
                baseUrl: process.env.REACT_APP_BLOCKFROST_BASE_URL_KEY,
                project_id: process.env.REACT_APP_BLOCKFROST_PROJECT_ID
            });
            let latestBlock = await blockfrost.getLatestBlock();
            let parameters = await blockfrost.getProtocolParameters(latestBlock.data.epoch);

            log(<div>tx builder started...</div>)
            let protocolParameters = {
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
            };
            log(<div>---------------- create the private key ----------------</div>)
            // let seed = bip39.generateMnemonic(256);
            let seed = "auction volume ginger day clean harbor nerve process expect dust elevator park deliver shrug rescue lesson unit wire holiday brother slow captain fade river"
            log(<div>seed: {seed}</div>)

            const entropyPrivateKey = bip39.mnemonicToEntropy(
                [ "test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice" ].join(' ')
            );
            const privateKey = CSL.Bip32PrivateKey.from_bip39_entropy(
                Buffer.from(entropyPrivateKey, 'hex'),
                Buffer.from(''),
            );

            const accountKey = privateKey
                .derive(harden(1852)) // purpose
                .derive(harden(1815)) // coin type
                .derive(harden(0)); // account #0

            const publicKey = accountKey
                .derive(0) // external
                .derive(0)
                .to_public();

            const stakeKey = accountKey
                .derive(2) // chimeric
                .derive(0)
                .to_public();

            const addressPool = [];
            for(let i = 0; i < 10; i++){
                const tempPublicKey = accountKey
                    .derive(0) // external
                    .derive(i)
                    .to_public();
                const address = CSL.BaseAddress.new(
                    CSL.NetworkInfo.mainnet().network_id(),
                    CSL.StakeCredential.from_keyhash(tempPublicKey.to_raw_key().hash()),
                    CSL.StakeCredential.from_keyhash(tempPublicKey.to_raw_key().hash())
                ).to_address();
                addressPool.push(address)
            }

            // const privateKey = CSL.PrivateKey.generate_ed25519();
            log(<div>privateKey (to_bech32): {privateKey.to_bech32()}</div>)
            log(<div>publicKey (to_bech32): {publicKey.to_bech32()}</div>)
            log(<div>stakeKey (to_bech32): {stakeKey.to_bech32()}</div>)
            log(<div>addressPool (to_bech32): {addressPool.map(a => a.to_bech32()).join("\n")}</div>)

            log(<div>---------------- create the private key for the policy ----------------</div>)
            // let seedPolicy = bip39.generateMnemonic(256);
            let seedPolicy = "hungry miss kangaroo pattern ghost derive pluck hunt recipe tank thank ensure quick install addict total announce lyrics resource arrow bus wagon aerobic timber";
            log(<div>seedPolicy: {seedPolicy}</div>)
            const entropyPolicyPrivateKey = bip39.mnemonicToEntropy(seedPolicy);
            const policyPrivateKey = CSL.Bip32PrivateKey.from_bip39_entropy(
                Buffer.from(entropyPolicyPrivateKey, 'hex'),
                Buffer.from(''),
            );

            const policyAccountKey = privateKey
                .derive(harden(1852)) // purpose
                .derive(harden(1815)) // coin type
                .derive(harden(0)); // account #0

            const policyPublicKey = accountKey
                .derive(0) // external
                .derive(0)
                .to_public();

            const policyStakeKey = accountKey
                .derive(2) // chimeric
                .derive(0)
                .to_public();
            // let policyPrivateKey = CSL.PrivateKey.generate_ed25519()
            log(<div>policyAccountKey (to_bech32): {policyAccountKey.to_bech32()}</div>)
            log(<div>policyPublicKey (to_bech32): {policyPublicKey.to_bech32()}</div>)
            log(<div>policyStakeKey (to_bech32): {policyStakeKey.to_bech32()}</div>)
            log(<div>---------------- create the policy with the keys above ----------------</div>)

            const policyPubKey = policyPrivateKey.to_public();
            const policyAddress = CSL.BaseAddress.new(
                CSL.NetworkInfo.mainnet().network_id(),
                CSL.StakeCredential.from_keyhash(policyPubKey.to_raw_key().hash()),
                CSL.StakeCredential.from_keyhash(policyPubKey.to_raw_key().hash())
            ).to_address();
            log(<div>policyAddress: {policyAddress.to_bech32()}</div>)

            const address = CSL.BaseAddress.new(
                CSL.NetworkInfo.mainnet().network_id(),
                CSL.StakeCredential.from_keyhash(publicKey.to_raw_key().hash()),
                CSL.StakeCredential.from_keyhash(publicKey.to_raw_key().hash())
            ).to_address();
            log(<div>address: {address.to_bech32()}</div>)

            const ttl = latestBlock.data.slot + 60 * 60 * 2;  // two hours from now
            const txBuilder = CSL.TransactionBuilder.new(
                CSL.TransactionBuilderConfigBuilder.new()
                    .fee_algo(
                        CSL.LinearFee.new(BigNum.from_str(parameters.data.min_fee_a.toString()),
                            CSL.BigNum.from_str(parameters.data.min_fee_b.toString()))
                    )
                    .pool_deposit(CSL.BigNum.from_str(parameters.data.pool_deposit))
                    .key_deposit(CSL.BigNum.from_str(parameters.data.key_deposit))
                    .coins_per_utxo_word(CSL.BigNum.from_str(parameters.data.coins_per_utxo_word))
                    .max_value_size(parameters.data.max_val_size)
                    .max_tx_size(parameters.data.max_tx_size)
                    .prefer_pure_change(true)
                    .build()
            )
            log(<div>txBuilder is ready...</div>)

            const scripts = CSL.NativeScripts.new();

            const policyKeyHash = CSL.BaseAddress.from_address(policyAddress)
                .payment_cred()
                .to_keyhash();

            log(<div>the policy keyhash is: ${Buffer.from(policyKeyHash.to_bytes()).toString("hex")}</div>);

            // add key hash script so only people with policy key can mint assets using this policyId
            const keyHashScript = CSL.NativeScript.new_script_pubkey(
                CSL.ScriptPubkey.new(policyKeyHash)
            );
            scripts.add(keyHashScript);

            const policyTtl = ttl;

            log(<div>the policy time to live is: {policyTtl}</div>);

            // add timelock so policy is locked after this slot
            const timelock = CSL.TimelockExpiry.new(policyTtl);
            const timelockScript = CSL.NativeScript.new_timelock_expiry(timelock);
            scripts.add(timelockScript);

            const mintScript = CSL.NativeScript.new_script_all(
                CSL.ScriptAll.new(scripts)
            );

            // select the utxo to use as input
            let utxos = await blockfrost.getAddressUTXOs(address.to_bech32()).catch(e => {
                return e.response;
            });
            let utxo = null;
            if (utxos.data && utxos.data.status_code === 200) {
                for (const utxoEntry of utxos.data) {
                    if (utxoEntry.amount > 3000000) {
                        utxo = utxoEntry;
                    }
                }
            }

            if (utxo === null) {
                log(<div>selected the utxo: no valid utxo found</div>);
                // throw new Error("no utxo found with sufficient ADA.");
            } else {
                log(<div>selected the utxo: {JSON.stringify(utxo)}</div>);
            }
        }
        buildNFT();
    }, [])
    return (
        <div>
            {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    )
}

export default Builder;