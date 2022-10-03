import { Vkeywitness } from '@emurgo/cardano-serialization-lib-nodejs'
import CoinSelection from './coinSelection.js'
import {getUtxos, newTxBuilder, signTx, submitTx, bytesToString, getProtocolParameters, waitForConfirmation} from './util.js'
import * as S from "@emurgo/cardano-serialization-lib-asmjs";
const Buffer = (await import('buffer/')).Buffer

// WARNING no coin selection algorithm is being used
// for this to be used seriously, consider using randomImprove or similar
// ADDITIONALLY: we make no attempt to split transactions in case this will be too large for a single tx
// see Nami's implementation of tx balancing to solve this.
// FINALLY: this doesn't do metadata, that is left as an exercise to the reader.
// When we release our open-source minting SDK it will feature all of the above!!
// https://github.com/lovalabs/cardano-minting-lib
const genTx = (addr_keyhash, timelockExpirySlot, assetNameStr, assetNum, addr, utxos, txBuilder) => {
    const nativeScripts = S.NativeScripts.new()
    const scriptPubkey = S.NativeScript
        .new_script_pubkey(
            S.ScriptPubkey.new(addr_keyhash)
        )
    const scriptTimelock = S.NativeScript
        .new_timelock_expiry(
            S.TimelockExpiry.new(timelockExpirySlot)
        )

    nativeScripts.add(
        scriptPubkey
    )
    nativeScripts.add(
        scriptTimelock
    )
    const nativeScript =
        S.NativeScript
            .new_script_all(
                S.ScriptAll.new(nativeScripts)
            )

    const policyId = Buffer.from(
        nativeScript.hash(0).to_bytes()
    ).toString('hex')

    const assetName = S.AssetName.new(Buffer.from(assetNameStr, 'utf-8'))
    const assetNumber = S.Int.new_i32(assetNum)

    txBuilder.add_mint_asset_and_output_min_required_coin(
        nativeScript,
        assetName,
        assetNumber,
        addr
    )

    console.log(timelockExpirySlot)
    txBuilder.set_ttl(timelockExpirySlot)

    var inputs = []
    utxos.forEach((utxo) => {
        inputs.push({
            utxo: utxo.input(),
            value: utxo.output().amount()
        })
    })
    txBuilder.add_key_input(
        addr_keyhash,
        inputs[0].utxo,
        inputs[0].value
    )

    txBuilder.add_change_if_needed(addr)

    const tx = txBuilder.build_tx()

    return { tx, nativeScript }
}
/*
In this example a wallet object has the following properties:
const w = {
    "rootKey": ...,
    "paymentKey": ...,
    "stakeKey": ..,
    "paymentAddr": ..
}
*/
export const mintToken = async (wallet, addr) => {
    const protocolParameters = await getProtocolParameters()
    var timelockExpirySlot = protocolParameters.slot+100000 // some slot in the future
    const txBuilder = newTxBuilder(protocolParameters)
    const utxos = await getUtxos(wallet)
    const keyHash = wallet.paymentKey.to_public().hash()
    const {tx, nativeScript} = genTx(keyHash, timelockExpirySlot, "test", 1, S.Address.from_bech32(addr), utxos, txBuilder)
    // We use a custom signTx method similar to the one in Nami wallet but it also takes a wallet object as an argument
    // which is used for signing the transaction.
    const txVkeyWitness = await signTx(
        Buffer.from(tx.to_bytes()).toString('hex'),
        wallet,
        undefined,
        true //Note: partialSign = true
    )
    const txWitnesses = S.TransactionWitnessSet.from_bytes(
        Buffer.from(txVkeyWitness.to_bytes(), 'hex')
    );

    const transactionWitnessSet = tx.witness_set()
    transactionWitnessSet.set_vkeys(txWitnesses.vkeys())

    const signedTx = S.Transaction.new(
        tx.body(),
        transactionWitnessSet
    )
    return await submitTx(Buffer.from(signedTx.to_bytes(),'hex').toString('hex'))
}