import type {NextPage} from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {useEffect} from "react";
import {Button} from "@mui/material";
import {BlockfrostProvider, BrowserWallet, ForgeScript, Transaction} from "@martifylabs/mesh";
import {NativeScript} from "@emurgo/cardano-serialization-lib-nodejs";
import * as CardanoWasm from "@emurgo/cardano-serialization-lib-browser"
import * as MessageSigning from "@emurgo/cardano-message-signing-browser"
import parseAsHeaders from "parse-headers";
import { resolveSlotNo } from '@martifylabs/mesh';


const Home: NextPage = () => {
    useEffect(() => {
        console.log("home loaded", {
            env: process.env
        });
    }, [])

    async function signAndVerify(wallet: { signData: (arg0: any, arg1: any) => any; }, address: any, arbitraryMessage: any){
        const signedMessage = await wallet.signData(address, arbitraryMessage);
        console.error("signedMessage", signedMessage);

        // @ts-ignore
        const message = MessageSigning.COSESign1.from_bytes(Buffer.from(Buffer.from(signedMessage.signature, "hex"), "hex"));
        const headermap = message.headers().protected().deserialized_headers();
        // @ts-ignore

        const coseKey = MessageSigning.COSEKey.from_bytes(Buffer.from(signedMessage.key, "hex"));

        // @ts-ignore
        const publicKey = CardanoWasm.PublicKey.from_bytes(coseKey.header(MessageSigning.Label.new_int(MessageSigning.Int.new_negative(MessageSigning.BigNum.from_str("2")))).as_bytes());

        // const edSig = CardanoWasm.Ed25519Signature.from_bytes(Buffer.from(signedMessage.signature, "hex"));

        const data = message.signed_data().to_bytes();
        const body_from_token = Buffer.from(data).toString("utf-8");

        const ed25519Sig = CardanoWasm.Ed25519Signature.from_bytes(
            message.signature()
        );

        console.error("coseKey, publicKey", {
            coseKey,
            publicKey,
            message,
            data,
            ed25519Sig,
            body_from_token
        });

        if (!publicKey.verify(data, ed25519Sig)) {
            throw new Error(
                `Message integrity check failed (has the message been tampered with?)`
            );
        }

        const parsed_body = parseAsHeaders(body_from_token);

        // @ts-ignore
        if (parsed_body["expire-date"] && new Date(parsed_body["expire-date"]) < new Date()) {
            throw new Error("Token expired");
        }
        alert("message verified!")
    }

    async function onMint() {
        console.log("minting started", {
            env: process.env
        });
        // @ts-ignore
        const blockfrostProvider = new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID);
        let params = await blockfrostProvider.fetchProtocolParameters();
        const slot = resolveSlotNo('preprod');

        console.log("network params", params);


        // connect to a wallet
        const wallet = await BrowserWallet.enable('eternl');

        const usedAddresses = await wallet.getUsedAddresses();

        let addressToUse = "addr_test1qqz8sy4d438czudh8dvlgacj27m2fy23z7v4275lknfy0km5a82wje8kfd63n5u2wrea98aq7cdaty25t2sc8vkt2rxsca56y9";
        let recipient = "addr_test1qp3xhvczczsn62qemfgekvs78hvw8talcefz88n4d6kqaut5a82wje8kfd63n5u2wrea98aq7cdaty25t2sc8vkt2rxsfmenp3";

        let address = null;
        for (const usedAddress of usedAddresses) {
            if (usedAddress === addressToUse) {
                address = usedAddress;
            }
        }
        if (!address) {
            throw new Error("no useful address found")
        }
        // const forgingScript = ForgeScript.withOneSignature(address);

        // rebuildingo of const forgingScript = ForgeScript.withOneSignature(address);
        const toAddress = (bech32: string) => CardanoWasm.Address.from_bech32(bech32);
        const toBaseAddress = (bech32: string) => CardanoWasm.BaseAddress.from_address(toAddress(bech32));
        const toEnterpriseAddress = (bech32: string) => CardanoWasm.EnterpriseAddress.from_address(toAddress(bech32));
        const toBytes = (hex: string) => {
            if (hex.length % 2 === 0 && /^[0-9A-F]*$/i.test(hex))
                return Buffer.from(hex, 'hex') as Uint8Array;

            return Buffer.from(hex, 'utf-8');
        };
        const resolvePaymentKeyHash = (bech32: string) => {
            try {
                const paymentKeyHash = [
                    toBaseAddress(bech32)?.payment_cred().to_keyhash(),
                    toEnterpriseAddress(bech32)?.payment_cred().to_keyhash(),
                ].find((kh) => kh !== undefined);

                if (paymentKeyHash !== undefined)
                    return paymentKeyHash.to_hex();

                throw new Error(`Couldn't resolve payment key hash from address: ${bech32}`);
            } catch (error) {
                throw new Error(`An error occurred during resolvePaymentKeyHash: ${error}.`);
            }
        };
        const deserializeEd25519KeyHash = (ed25519KeyHash: string) => CardanoWasm.Ed25519KeyHash
            .from_bytes(toBytes(ed25519KeyHash));

        const getForgeScript = (address: string) => {
            const buildScriptPubkey = (keyHash: string) => {
                const scriptPubkey = CardanoWasm.ScriptPubkey.new(
                    deserializeEd25519KeyHash(keyHash),
                );
                let nativeScript = CardanoWasm.NativeScript.new_script_pubkey(scriptPubkey);
                // make the native script from scratch
                let policyJSON = JSON.stringify({
                    type: 'all',
                    scripts:
                        [
                            {
                                type: 'before',
                                slot: slot + 60 * 5
                            },
                            {
                                type: 'sig',
                                keyHash: `${keyHash}`
                            }
                        ]
                }, null, 4);
                console.log("policy json", policyJSON);
                // const nativeScript = CardanoWasm.NativeScript.from_json(policyJSON);

                return nativeScript;
            };
            const keyHash = resolvePaymentKeyHash(address);
            return buildScriptPubkey(keyHash).to_hex();
        }
        const nativeForgingScript = getForgeScript(address);

        const tx = new Transaction({initiator: wallet});

        // define asset#1 metadata
        const assetMetadata1 = {
            "name": "PORCOLADRO2",
            "image": "ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua",
            "mediaType": "image/jpg",
            "description": "This NFT is minted by Mesh (https://mesh.martify.io/)."
        };
        const asset1 = {
            assetName: 'PORCOLADRO',
            assetQuantity: '1',
            metadata: assetMetadata1,
            label: '721',
            recipient: {
                address: recipient,
            },
        };
        tx.mintAsset(
            nativeForgingScript,
            asset1,
        );

        const unsignedTx = await tx.build();
        const signedTx = await wallet.signTx(unsignedTx).catch(e => {
            console.error("minting error", e)
        });
        if(signedTx){
            const txHash = await wallet.submitTx(signedTx).catch(e => {
                console.error("minting error", e)
            });
            console.log("minting done", txHash)
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className={styles.main}>
                Minta il PORCO *** LADRO NFT.
                <Button onClick={onMint}>mintalo ora, ccoddio</Button>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16}/>
          </span>
                </a>
            </footer>
        </div>
    )
}

export default Home
