
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers, utils } from 'ethers';
import delegateContractArtifact from '../constants/PermissionedEIP712Proxy.json'

const PRIVATE_KEY = '40017602f8578a171a66d443df8780ca3b2645e73f1ba701df06969e028ff3fc'
const chainConfig = {
    "xdcTest": {
        "rpcUrl": "https://erpc.apothem.network",
        "easContractAddress": "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF",
        "schemaRegistry": "0x7C31307c71e81A3A8211cF9238bFe72F425eCd42",
        "schemaUid": "0x00265a412332b7232eeb0e4df41a6b71e67e2f96a46bd46799c4abd642243fbc",
        "schemaString": "string thisisjustastring2",
        "data": [{ name: "thisisjustastring2", value: "adsf asdf f", type: "string" }],
        "attestationUid": "",
    },
    "sepolia": {
        // "rpcUrl": 'https://eth-sepolia.g.alchemy.com/v2/nhlteAOKtzO7rSq44OUNOVixQph-nSjU',
        "rpcUrl": "https://sepolia.infura.io/v3/cb170dd391aa4fde91f165b7d943a197",
        "easContractAddress": "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
        "schemaRegistry": "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",

        "schemaUid": "0x585dd47899a09ecf58b34a91df3e1a4f31af9a6076fb993fc0d4262f64405ede",
        "schemaString": "string theName, uint256 theAge",
        "data": [
            { name: "theName", value: "michael jordan", type: "string" },
            { name: "theAge", value: 60, type: "uint256" }
        ],
        "attestationUid": "0x462cb0345873581778faa65de77d7876c8533c68d457cedfac1cee229d08abb7",

        // //settings from docs
        // "schemaUid": "0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995",
        // "schemaString": "uint256 eventId, uint8 voteIndex",
        // "data": [
        //     { name: "eventId", value: 1, type: "uint256" },
        //     { name: "voteIndex", value: 1, type: "uint8" },
        // ],
        // "attestationUid": "0x2368ee0ea276858809590fd0dca6ac3d422c8aac05ed3e2793e5b519966d6e9b",
    }
}

const config = chainConfig["sepolia"];


function EAStest() {
    const EASContractAddress = config.easContractAddress

    // Initialize the sdk with the address of the EAS Schema contract address 
    const eas = new EAS(EASContractAddress);

    // Gets a default provider (in production use something else like infura/alchemy)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const signer = wallet.connect(provider);

    // Connects an ethers style provider/signingProvider to perform read/write functions.
    // MUST be a signer to do write operations!
    // eas.connect(provider);
    eas.connect(signer);

    //-------------------------------------------------------------------------------

    const delegatedAttestation = async () => {

        console.log("Delegated Attestation....")
        //**Create Attestation Request using EAS SDK**
        const schemaEncoder = new SchemaEncoder("string theName, uint256 theAge");
        const encodedData = schemaEncoder.encodeData(
            [
                { name: "theName", value: "tracy mcgrady", type: "string" },
                { name: "theAge", value: 44, type: "uint256" },
            ],
        );
        console.log("encoded  data using EAS SDK: tmac 44 ")

        const attestationRequestData = {
            recipient: "0xd023c65d8D0b38c0B173283449450A6c4a97C6c5",
            expirationTime: 0,
            revocable: true, // Be aware that if your schema is not revocable, this MUST be false
            refUID: null,
            data: encodedData,
            value: 0
        }

        //create signature *********************************
        console.log("creating signature....")
        // EIP-712 types 
        const domain = {
            name: 'My DApp',
            version: '1.0',
            chainId: 1,
            verifyingContract: "0xEf94a35D43194787Fed6793790aD330d89DA42A7"
        };

        const types = {
            DelegatedProxyAttestationRequest: [
                { name: 'schema', type: 'bytes32' },
                { name: 'data', type: 'AttestationRequestData' },
                { name: 'attester', type: 'address' }
            ]
        };

        // Struct data 
        const value = {
            schema: "0x585dd47899a09ecf58b34a91df3e1a4f31af9a6076fb993fc0d4262f64405ede",
            data: encodedData,
            attester: wallet.address
        };


        // Hash struct according to EIP-712 
        const hash = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(
                JSON.stringify(domain) +
                JSON.stringify(types) +
                JSON.stringify(value)
            )
        );

        // Sign the hash 
        //   const wallet = new ethers.Wallet(privateKey);
        const signature = await wallet.signMessage(ethers.utils.arrayify(hash));
        console.log("Signature: ", signature)



        // create the delegated attestation request **********************************
        // call the proxy eip712 delegated attestatoin contract's function
        const delegatedAttestationRequest = {
            schema: "0x585dd47899a09ecf58b34a91df3e1a4f31af9a6076fb993fc0d4262f64405ede",
            data: attestationRequestData,
            signature: signature,
            attester: "0x9343e38cFfccCb4996C76eD56C97c7f27560917b"
        }

        console.log("delegatedAttestationRequest: ", delegatedAttestationRequest)

        const encoded = utils.defaultAbiCoder.encode(
            ['bytes32', '(address,uint64,bool,bytes32,bytes,uint256)', 'bytes', 'address'],
            [delegatedAttestationRequest.schema, attestationRequestData, delegatedAttestationRequest.signature, delegatedAttestationRequest.attester]
        )

        const wallet2 = new ethers.Wallet("58ef3f5f916edf02d3dc98cf61b23d07d4d81e39e44aca0106ee12adedd36a68");
        const signer2 = wallet2.connect(provider);
        console.log("signer2's address: ", signer2.address)

        // address: 0xFC78985EBC569796106dd4b350a3e0Ac6c5c110c
        // privkey: 58ef3f5f916edf02d3dc98cf61b23d07d4d81e39e44aca0106ee12adedd36a68

        // ethers and contract ABI imports 

        const abi = delegateContractArtifact.abi;

        const delegateContract = new ethers.Contract('0xEf94a35D43194787Fed6793790aD330d89DA42A7', abi, signer2); //sign with a different address
        console.log("delegateContract address: ", delegateContract.address)

        // // Build request object
        // const request = {
        //     schema: config.schemaUid,
        //     data: attestationRequestData,
        //     signature: signature,
        //     attester: signer.address
        // }

        try {
            // Call contract function
            const tx = await delegateContract.attestByDelegation(encoded)

            // Wait for transaction  
            const attestationUid = await tx.wait();

            console.log("new attestation uid: ", attestationUid);
        } catch (e) {
            console.log(e)
        }
    }


    //-------------------------read attestation----------------------------------------------------


    const getAttestation = async () => {
        console.log("\nGetting attestation....")
        const uid = config.attestationUid;
        const attestation = await eas.getAttestation(uid);
        console.log(attestation);

        const schema = await getSchema(config.schemaUid)

        const encoder = new SchemaEncoder(schema.schema);
        const data = encoder.decodeData(attestation.data);
        console.log("data: ", data)

    }

    //----------------------Create attestation --------------------------------------------------------
    // Initialize SchemaEncoder with the schema string

    const makeAttestation = async () => {

        console.log("Making attestation....")

        const schemaEncoder = new SchemaEncoder(config.schemaString);
        //"schemaString": "string thisisjustastring3",

        const encodedData = schemaEncoder.encodeData(
            config.data
            //"data": [{ name: "thisisjustastring3", value: "adsf asdf", type: "string" }],
        );

        const schemaUID = config.schemaUid;

        console.log("Attesting...")
        try {
            const tx = await eas.attest({
                schema: schemaUID,
                data: {
                    recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                    expirationTime: 0,
                    revocable: true, // Be aware that if your schema is not revocable, this MUST be false
                    data: encodedData,
                },
            });

            const newAttestationUID = await tx.wait();

            console.log("New attestation UID:", newAttestationUID);
        } catch (e) {
            console.log(e)
        }
    }


    // Create schema -----------------------------------------
    const createSchema = async () => {
        console.log("Creating schema...")
        const schemaRegistryContractAddress = config.schemaRegistry;

        const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);


        schemaRegistry.connect(signer);

        const schema = "string theName, uint256 theAge";
        // const resolverAddress = schemaRegistryContractAddress; // Sepolia 0.26
        const revocable = true;

        try {
            const transaction = await schemaRegistry.register(
                { schema, revocable, },
                // { gasLimit: 50000000 }
            );

            // Optional: Wait for transaction to be validated
            const receipt = await transaction.wait();
            console.log("new schema uid: ", receipt);

        } catch (e) {
            console.log(e)
        }
    }


    const getSchema = async (schemaUID = config.schemaUid) => {
        console.log("Getting schema...")
        console.log("schema UID: ", schemaUID)

        const schemaRegistryContractAddress = config.schemaRegistry; // Sepolia 0.26
        const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);
        schemaRegistry.connect(provider);

        // const schemaUID = config.schemaUid;

        const schemaRecord = await schemaRegistry.getSchema({ uid: schemaUID });

        console.log("schema: ", schemaRecord[3]);

        return schemaRecord
    }

    return (
        <>
            <div>EAStest------------------------</div>
            <button onClick={getAttestation}>Get Attestation</button>
            <button onClick={makeAttestation}>Make Attestation</button>
            <button onClick={createSchema}>Create Schema</button>
            <button onClick={() => getSchema(config.schemaUid)}>Get Schema</button>

            <br />

            <button onClick={delegatedAttestation}>Delegated Attestation</button>

        </>
    )

}

export default EAStest