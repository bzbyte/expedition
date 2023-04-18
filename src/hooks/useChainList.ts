// import { useEffect } from "react";
// import { uniqBy } from "lodash";
import { IChain as Chain } from "../models/chain";
import React from "react";

// const mergeChainSets = (c1: Chain[], c2: Chain[]) => uniqBy(c1.concat(c2), "name");

export default function() {
  const [chains, setChains] = React.useState<Chain[]>([
    {
      name: "𝚲ppVika (Mountain View) on z13",
      network: "demonet",
      rpc: ["http://[2a00:fb01:400:42:5000:89ff:fe2d:8a37]:8545"],
    },
    {
      name: "𝚲ppVika (Mountain View) on BobCat",
      network: "demonet",
      rpc: ["http://[2a00:fb01:400:43:5000:49ff:fec7:adae]:8545"],
    },
    {
      name: "𝚲ppVika (Palo Alto) on testnet",
      network: "testnet",
      rpc: ["http://localhost:8545"],
    },
  ]);

  // uncomment once we add 'chain list provider' concept. This list blows.

  // useEffect(() => {
  //   if (chains === undefined) {
  //     fetch("https://chainid.network/chains.json")
  //       .then((r) => r.json())
  //       .then((chainIdNetwork) => {
  //         const filteredChains = chainIdNetwork.filter((c: Chain) => {
  //           if (c.rpc.length === 0) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         if (chains) {
  //           setChains(mergeChainSets(chains, filteredChains));
  //         } else {
  //           setChains(filteredChains);
  //         };
  //       });
  //   }
  // }, [chains]);

  return [chains, setChains];
}
