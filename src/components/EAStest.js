
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers, utils } from 'ethers';
import delegateContractArtifact from '../constants/PermissionedEIP712Proxy.json'

const PRIVATE_KEY = '40017602f8578a171a66d443df8780ca3b2645e73f1ba701df06969e028ff3fc'
const attesterAddress = "0x9343e38cFfccCb4996C76eD56C97c7f27560917b"
const recipientAddress = "0xFC78985EBC569796106dd4b350a3e0Ac6c5c110c"

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
        "chainId": 11155111,
        "delegateContractAddress": "0xEf94a35D43194787Fed6793790aD330d89DA42A7",
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
        const rawData = [
            { name: "theName", value: "tracy mcgrady", type: "string" },
            { name: "theAge", value: 44, type: "uint256" },
        ];

        const encodedData = schemaEncoder.encodeData(
            rawData
        );

        const types = {
            DataElement: [
                { name: "name", type: "string" },
                { name: "value", type: "string" },
                { name: "type", type: "string" },
            ],
            AttestationRequestData: [
                { name: "recipient", type: "address" },
                { name: "expirationTime", type: "uint64" },
                { name: "revocable", type: "bool" },
                { name: "refUID", type: "bytes32" },
                { name: "data", type: "DataElement[]" },
                { name: "value", type: "uint256" },
            ],
        };

        const domainData = {
            name: "PermissionedEIP712Proxy",
            version: "1",
            chainId: config.chainId,
            verifyingContract: config.delegateContractAddress,
        };

        const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

        const message = {
            recipient: recipientAddress,
            expirationTime: 0,
            revocable: true,
            refUID: zeroBytes32, // Zero address for refUID
            data: rawData,
            value: 0,
        };

        let signature
        try {
            signature = await wallet._signTypedData(domainData, types, message);

            console.log("signature: ", signature)
        } catch (e) {
            console.log(e)
        }

        const request = {
            schema: config.schemaUid, // bytes32
            data: message,
            signature: signature, // bytes 
            attester: signer.address, // address
            deadline: 0 // uint64
        }

        console.log("Signer address: ", signer.address)

        const delegateContract = new ethers.Contract(config.delegateContractAddress, delegateContractArtifact.abi, signer);


        try {
            const uid = await delegateContract.attestByDelegation(request);
            console.log("delegate attestation uid: ", uid)
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