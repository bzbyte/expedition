import ERPC from "@etclabscore/ethereum-json-rpc";
import * as React from "react";
import cbor from "cbor";
import useInterval from "use-interval";
import { hexToNumber } from "@etclabscore/eserialize";

export const getBlocks = (from: number, to: number, erpc: ERPC): Promise<any> => {
  const promises: any[] = [];

  for (let i = from; i <= to; i++) {
    promises.push(erpc.eth_getBlockByNumber(`0x${i.toString(16)}`, true));
  }
  return Promise.all(promises);
};

export const useBlockNumber = (erpc: ERPC | undefined): [number] => {
  const [blockNumber, setBlockNumber] = React.useState<number>(NaN);
  useInterval(() => {
    if (!erpc) {
      return;
    }
    erpc.eth_blockNumber().then((bn: string) => {
      setBlockNumber(hexToNumber(bn));
    });
  }, 7000, true);
  React.useEffect(() => {
    if (erpc) {
      erpc.eth_blockNumber().then((bn: string) => {
        setBlockNumber(hexToNumber(bn));
      });
    }
  }, [erpc]);
  return [blockNumber];
};

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
    throw new Error('Invalid hexadecimal string.');
  }
  const buffer = [...hex]
    .reduce((acc, curr, i) => {
      // tslint:disable-next-line:no-bitwise
      acc[(i / 2) | 0] = (acc[(i / 2) | 0] || '') + curr;
      return acc;
    }, [] as string[])
    .map(x => Number.parseInt(x, 16));

  return new Uint8Array(buffer).buffer;
}

const DER_PREFIX = fromHex(
  '308182301d060d2b0601040182dc7c0503010201060c2b0601040182dc7c05030201036100',
);
const KEY_LENGTH = 96;

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


async function fetchGroupPublicKey(erpc: ERPC | undefined, groupPublicKey: string, setGroupPublicKey: React.Dispatch<React.SetStateAction<string>>) {
  if (!erpc) {
    return [groupPublicKey];
  }
  let parsedUrl = new URL(erpc.transport.uri);
  let url = parsedUrl.protocol + "//" + parsedUrl.hostname + ":8080/api/v2/status";
  const controller = new AbortController()
  const signal = controller.signal
  let timeoutId = setTimeout(() => {
    controller.abort()
  }, 5000)
  let resp = await fetch(url, { signal }).catch(e => { return false; });
  if (typeof resp == "boolean") {
    clearTimeout(timeoutId);
    setGroupPublicKey("Fetching ...");
    return;
  }
  resp
    .arrayBuffer()
    .then(data => cbor.decodeAll(data))
    .then(data => {
      let root_key = extractDER(data[0].value.root_key);
      clearTimeout(timeoutId);
      setGroupPublicKey(Buffer.from(root_key).toString('hex'));
    });
}

export const useGroupPublicKey = (erpc: ERPC | undefined): [string] => {
  const [groupPublicKey, setGroupPublicKey] = React.useState<string>("Fetching ...");
  React.useEffect(() => {
    fetchGroupPublicKey(erpc, groupPublicKey, setGroupPublicKey);
  }, [groupPublicKey, erpc]);
  return [groupPublicKey];
};

export default getBlocks;
