import {useEffect} from "react";
import Button from "@mui/material/Button";
import {Typography} from "@mui/material";
import { Transaction, BrowserWallet, ForgeScript } from '@martifylabs/mesh';
import * as CardanoWasm from "@emurgo/cardano-serialization-lib-asmjs";


export default function NFTMint(props) {
    useEffect(() => {
        console.warn("minting page has loaded")
    }, []);
    const onMint = async () => {
        console.log("minting started")
        // connect to a wallet
        const wallet = await BrowserWallet.enable('eternl');

        const usedAddress = await wallet.getUsedAddresses();
        const address = usedAddress[0];
        const forgingScript = ForgeScript.withOneSignature(address);

        const tx = new Transaction({ initiator: wallet });

        // define asset#1 metadata
        const assetMetadata1 = {
            "name": "Mesh Token?",
            "image": "ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua",
            "mediaType": "image/jpg",
            "description": "This NFT is minted by Mesh (https://mesh.martify.io/)."
        };
        const asset1 = {
            assetName: 'MeshToken?',
            assetQuantity: '1',
            metadata: assetMetadata1,
            label: '721',
            recipient: {
                address: 'addr_test1vpvx0sacufuypa2k4sngk7q40zc5c4npl337uusdh64kv0c7e4cxr',
            },
        };
        tx.mintAsset(
            forgingScript,
            asset1,
        );

        const unsignedTx = await tx.build();
        const signedTx = await wallet.signTx(unsignedTx);
        const txHash = await wallet.submitTx(signedTx);
        console.log("minting done", txHash)
    }
    return (
        <div>
            <Typography variant={"h4"}>
                nftmint
            </Typography>
            <div>
                <Button onClick={()=>{
                    alert("???")
                }}>mint</Button>
            </div>
        </div>
    )
}