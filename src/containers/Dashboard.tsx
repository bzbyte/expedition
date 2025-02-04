import { Grid, Typography, CircularProgress, Theme, Button } from "@material-ui/core";
import useEthRPCStore from "../stores/useEthRPCStore";
import * as React from "react";
import { weiToGwei } from "../components/formatters";
import HashRate from "../components/HashRate";
import getBlocks, { useBlockNumber } from "../helpers";
import { useGroupPublicKey, useStateCertificate, useIdentityCertificate } from "../appvikarpc";
import useInterval from "use-interval";
import { useTheme } from "@material-ui/styles";
import getTheme from "../themes/victoryTheme";
import ChartCard from "../components/ChartCard";
import BlockListContainer from "./BlockList";
import { hexToNumber } from "@etclabscore/eserialize";
import { useTranslation } from "react-i18next";
import { ArrowForwardIos } from "@material-ui/icons";
import StatCharts from "../components/StatCharts";
import { Block as IBlock, IsSyncingResult as ISyncing } from "@etclabscore/ethereum-json-rpc";
import type * as CSS from 'csstype';
import { CopyToClipboard } from "react-copy-to-clipboard";

const useState = React.useState;

const config = {
  blockTime: 15, // seconds
  blockHistoryLength: 100,
  chartHeight: 200,
  chartWidth: 400,
};

export default (props: any) => {
  const [erpc] = useEthRPCStore();
  const theme = useTheme<Theme>();
  const victoryTheme = getTheme(theme);
  const [blockNumber] = useBlockNumber(erpc);
  const [groupPublicKey] = useGroupPublicKey(erpc);
  const [stateMessage, stateSignature] = useStateCertificate(erpc);
  const [identity, _identityMessage, identitySignature] = useIdentityCertificate(erpc);
  const [chainId, setChainId] = useState<string>();
  const [block, setBlock] = useState<IBlock>();
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [gasPrice, setGasPrice] = useState<string>();
  const [syncing, setSyncing] = useState<ISyncing>();
  let [peerCount, setPeerCount] = useState<string>();

  const groupCertificationStyle: CSS.Properties = {
    overflowWrap: 'break-word'
  };

  const { t } = useTranslation();

  React.useEffect(() => {
    if (!erpc) { return; }
    erpc.eth_chainId().then((cid) => {
      if (cid === null) { return; }
      setChainId(cid);
    });
  }, [erpc]);

  React.useEffect(() => {
    if (!erpc || blockNumber === undefined) { return; }
    erpc.eth_getBlockByNumber(`0x${blockNumber.toString(16)}`, true).then((b) => {
      if (b === null) { return; }
      setBlock(b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  React.useEffect(() => {
    if (!erpc || blockNumber === null) { return; }
    getBlocks(
      Math.max(blockNumber - config.blockHistoryLength + 1, 0),
      blockNumber,
      erpc,
    ).then((bl) => {
      setBlocks(bl);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  useInterval(() => {
    if (!erpc) { return; }
    erpc.eth_syncing().then(setSyncing);
  }, 10000, true);

  React.useEffect(() => {
    if (!erpc) { return; }
    erpc.net_peerCount().then(setPeerCount);
  }, [erpc]);

  React.useEffect(() => {
    if (!erpc) { return; }
    erpc.eth_gasPrice().then(setGasPrice);
  }, [erpc]);

  if (blocks === undefined || chainId === undefined || gasPrice === undefined || peerCount === undefined) {
    return <CircularProgress />;
  }

  peerCount = "4";
  let verification_script: string = "node ./lib/esm/main.js "+
                                    "--public_key='" + groupPublicKey + "' " +
                                    "--signature='" +  stateSignature + "' " +
                                    "--message='" +    stateMessage   + "' ";
  return (
    <div>
      <Grid container spacing={2} direction="column">
        <Grid item container justify="space-between">
          <Grid item key="blockHeight">
            <ChartCard title={t("Block Height")}>
              <Typography variant="h4">{blockNumber}</Typography>
            </ChartCard>
          </Grid>
          <Grid key="chainId" item>
            <ChartCard title={t("Chain ID")}>
              <Typography variant="h4">{hexToNumber(chainId)}</Typography>
            </ChartCard>
          </Grid>
          {syncing &&
            <div key="syncing">
              <ChartCard title={t("Syncing")}>
                {typeof syncing === "object" && syncing.currentBlock &&
                  <Typography variant="h4">
                    {hexToNumber(syncing.currentBlock)} / {hexToNumber(syncing.highestBlock || "0x0")}
                  </Typography>
                }
              </ChartCard>
            </div>
          }
          <Grid key="gasPrice" item>
            <ChartCard title={t("Gas Price")}>
              <Typography variant="h4">{weiToGwei(hexToNumber(gasPrice))} Gwei</Typography>
            </ChartCard>
          </Grid>
          <Grid key="hRate" item>
            <ChartCard title={t("Network Hash Rate")}>
              {block &&
                <HashRate block={block} blockTime={config.blockTime}>
                  {(hashRate: any) => <Typography variant="h4">{hashRate} GH/s</Typography>}
                </HashRate>
              }
            </ChartCard>
          </Grid>
          <Grid key="peers" item>
            <ChartCard title={t("Peers")}>
              <Typography variant="h4">{hexToNumber(peerCount)}</Typography>
            </ChartCard>
          </Grid>
        </Grid>
      </Grid>
      <StatCharts victoryTheme={victoryTheme} blocks={blocks} />

      <Grid spacing={3} direction="column">
        <ChartCard title={t("Public Key")}>
          <Typography variant="subtitle2">
            <div style={groupCertificationStyle}>
              <div><b>{groupPublicKey}</b></div>
            </div>
          </Typography>
        </ChartCard>

        <ChartCard title={t("State Certificate")}>
          <Typography variant="subtitle2">
            <div style={groupCertificationStyle}>
              <div><i>StateRoot:</i>      {stateMessage}  </div>
              <div><i>Signature:</i>      {stateSignature}</div>
              <CopyToClipboard text={verification_script}>
                <Button variant="outlined" size="small">Copy verification script to clipboard</Button>
              </CopyToClipboard>
            </div>
          </Typography>
        </ChartCard>


        <ChartCard title={t("Encryption Clock")}>
          <Typography variant="subtitle2">
            <div style={groupCertificationStyle}>
              <div><i>ID:</i>  {identity}  </div>
              <div><i>DecryptionKey:</i>  {identitySignature}</div>
            </div>
          </Typography>
        </ChartCard>

     </Grid>

      <Typography variant="subtitle2"> Build: Debug Rev(6e286587ba6b)</Typography>

      <Grid container justify="flex-end">
        <Button
          color="primary"
          variant="outlined"
          endIcon={<ArrowForwardIos />}
          onClick={() => props.history.push("/stats/miners")}
        >More Stats</Button>
      </Grid>
      <br />

      <BlockListContainer
        from={Math.max(blockNumber - 14, 0)}
        to={blockNumber}
        disablePrev={true}
        disableNext={blockNumber < 14}
        onNext={() => {
          props.history.push(`/blocks/${blockNumber - 15}`);
        }}
        style={{ marginTop: "30px" }} />
    </div >
  );
};
