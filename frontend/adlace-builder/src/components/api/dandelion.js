import axios from "axios";

export default function Dandelion(){

}
Dandelion.prototype.getLatestSlots = async function (){
    let response = await axios({
        method: 'post',
        url: 'https://graphql-api.mainnet.dandelion.link',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            query: `{ 
                blocks(
                    order_by: {
                        forgedAt: desc
                    }
                ) {
                    slotNo
                }
            }`,
            variables: {}
        })
    });
    return response;
}
Dandelion.prototype.getTransactions = async function(){
    return axios({
        method: 'post',
        url: 'https://graphql-api.mainnet.dandelion.link',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            query: `{ 
                transactions(
                    limit: 1000
                    where: {metadata: {key: { _eq: "55555"}}}
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
    });
}