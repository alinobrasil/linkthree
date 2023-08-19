
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

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

        // "schemaUid": "0x67a2b544148126495d05867459f2cfedc79fc88aea5229db128ab0f51bb31dd2",
        // "schemaString": "string thisisjustastring3",
        // "data": [{ name: "thisisjustastring3", value: "adsf asdf", type: "string" }],
        "schemaUid": "0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995",
        "schemaString": "uint256 eventId, uint8 voteIndex",
        "data": [
            { name: "eventId", value: 1, type: "uint256" },
            { name: "voteIndex", value: 1, type: "uint8" },
        ],
        "attestationUid": "0x2368ee0ea276858809590fd0dca6ac3d422c8aac05ed3e2793e5b519966d6e9b",
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

        const schema = "string thisisjustastring4";
        const resolverAddress = schemaRegistryContractAddress; // Sepolia 0.26
        const revocable = true;

        try {
            const transaction = await schemaRegistry.register(
                { schema, resolverAddress, revocable, },
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
        </>
    )

}

export default EAStest