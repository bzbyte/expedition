import ERPC from "@etclabscore/ethereum-json-rpc";
import * as React from "react";
import cbor from "cbor";

function isBufferEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    const a8 = new Uint8Array(a);
    const b8 = new Uint8Array(b);
    for (let i = 0; i < a8.length; i++) {
        if (a8[i] !== b8[i]) {
            return false;
        }
    }
    return true;
}

const hexRe = new RegExp(/^([0-9A-F]{2})*$/i);
export function fromHex(hex: string): ArrayBuffer {
    if (!hexRe.test(hex)) {
        throw new Error("Invalid hexadecimal string.");
    }
    const buffer = [...hex]
        .reduce((acc, curr, i) => {
            // tslint:disable-next-line:no-bitwise
            acc[(i / 2) | 0] = (acc[(i / 2) | 0] || "") + curr;
            return acc;
        }, [] as string[])
        .map((x) => Number.parseInt(x, 16));

    return new Uint8Array(buffer).buffer;
}

const DER_PREFIX = fromHex(
    "308182301d060d2b0601040182dc7c0503010201060c2b0601040182dc7c05030201036100",
);
const KEY_LENGTH = 96;
const AVK_RPC_PORT = 8080;

function extractDER(buf: ArrayBuffer): ArrayBuffer {
    const expectedLength = DER_PREFIX.byteLength + KEY_LENGTH;
    if (buf.byteLength !== expectedLength) {
        throw new TypeError(`BLS DER-encoded public key must be ${expectedLength} bytes long`);
    }
    const prefix = buf.slice(0, DER_PREFIX.byteLength);
    if (!isBufferEqual(prefix, DER_PREFIX)) {
        throw new TypeError(
            `BLS DER-encoded public key is invalid. Expect the following prefix: ${DER_PREFIX}, but get ${prefix}`,
        );
    }
    return buf.slice(DER_PREFIX.byteLength);
}


async function fetchGroupPublicKey(erpc: ERPC | undefined,
                                   groupPublicKey: string,
				   setGroupPublicKey: React.Dispatch<React.SetStateAction<string>>) {
    if (!erpc) {
        return [groupPublicKey];
    }
    let port: string = "";
    if (process.env.REACT_AVK_RPC_PORT === undefined) {
        port = AVK_RPC_PORT.toString();
    } else {
        port = process.env.REACT_AVK_RPC_PORT;
    }
    const parsedUrl = new URL(erpc.transport.uri);
    const url = parsedUrl.protocol + "//" + parsedUrl.hostname + ":" + port + "/api/v2/status";
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 5000);
    const resp = await fetch(url, { signal }).catch((e) =>  false);
    if (typeof resp === "boolean") {
        clearTimeout(timeoutId);
        setGroupPublicKey("Fetching ...");
        return;
    }
    resp
        .arrayBuffer()
        .then((data) => cbor.decodeAll(data))
        .then((data) => {
            const rootKey = extractDER(data[0].value.root_key);
            clearTimeout(timeoutId);
            setGroupPublicKey(Buffer.from(rootKey).toString("hex"));
        });
}

export const useGroupPublicKey = (erpc: ERPC | undefined): [string] => {
    const [groupPublicKey, setGroupPublicKey] = React.useState<string>("Fetching ...");
    React.useEffect(() => {
        fetchGroupPublicKey(erpc, groupPublicKey, setGroupPublicKey);
    }, [groupPublicKey, erpc]);
    return [groupPublicKey];
};

function bytesToHex(bytes: Buffer): string {
    const hex = [];
    for (let i = 0; i < bytes.length; i++) {
        let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}
// State Certificate
async function fetchStateCertificate(erpc: ERPC | undefined, stateCertificate: [string, string],
    setStateCertificate: React.Dispatch<React.SetStateAction<[string, string]>>) {
    if (!erpc) {
        return stateCertificate;
    }
    const parsedUrl = new URL(erpc.transport.uri);
    let port: string = "";
    if (process.env.REACT_AVK_RPC_PORT === undefined) {
        port = AVK_RPC_PORT.toString();
    } else {
        port = process.env.REACT_AVK_RPC_PORT;
    }
    const url = parsedUrl.protocol + "//" + parsedUrl.hostname + ":" + port + "/api/v2/cert_status";
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 5000);
    const resp = await fetch(url, { signal }).catch((e) => false);
    if (typeof resp === "boolean") {
        clearTimeout(timeoutId);
        setStateCertificate(["Fetching ...", "..."]);
        return;
    }
    resp
        .arrayBuffer()
        .then((certificate) => cbor.decodeAll(certificate))
        .then((certificate) => {
            clearTimeout(timeoutId);
            const msg = certificate[0].value.certificate.signed.content.hash;
            const signature = certificate[0].value.certificate.signed.signature.signature;
            setStateCertificate([bytesToHex(msg), bytesToHex(signature)]);
        });
}

export const useStateCertificate = (erpc: ERPC | undefined): [string, string] => {
    const [stateCertificate, setStateCertificate] = React.useState<[string, string]>(["Fetching ...", "..."]);
    React.useEffect(() => {
        fetchStateCertificate(erpc, stateCertificate, setStateCertificate);
    }, [stateCertificate, erpc]);
    return stateCertificate;
};
