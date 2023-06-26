import React from "react";
import BigNumber from "bignumber.js";
import { hashesToGH } from "../formatters";
import { hexToNumber } from "@etclabscore/eserialize";
import { Grid } from "@material-ui/core";
import ChartCard from "../ChartCard";
import { VictoryLine, VictoryBar, VictoryChart, VictoryAxis } from "victory";
import { useTranslation } from "react-i18next";

const config = {
  blockTime: 15, // seconds
  blockHistoryLength: 100,
  chartHeight: 200,
  chartWidth: 400,
};

const blockMapGasUsed = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: new BigNumber(block.gasUsed).dividedBy(1000000),
  };
};

const blockMapUncles = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: block.uncles.length,
  };
};

const blockMapHashRate = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: hashesToGH(new BigNumber(block.difficulty, 16).dividedBy(config.blockTime)),
  };
};

const blockMapTransactionCount = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: block.transactions.length,
  };
};
const blockMapBtcPrice = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: 30440.0 + block.parentHash % 20,
  };
};
const blockMapEthPrice = (block: any) => {
  return {
    x: hexToNumber(block.number),
    y: 1890.0 + block.parentHash % 20,
  };
};

function CalculateAggPrice(blocks: any[], base_price: number, change_frequency: number) {
    let next_block = Math.ceil(blocks[0].number / change_frequency) * change_frequency;
    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].number == next_block) {
            return dollar(base_price + (blocks[i].parentHash % 20));
        }
    }
    return dollar(base_price);
}

function dollar(price: number) {
    return " [ $" +  price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + " ]";
}

interface IProps {
  blocks: any[];
  victoryTheme?: any;
}

const StatCharts: React.FC<IProps> = ({ blocks, victoryTheme }) => {
  const { t } = useTranslation();
  return (
    <Grid item container>
      <Grid key="hashChart" item xs={12} md={6} lg={3}>
        <ChartCard title={t("Hash Rate")}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryLine data={blocks.map(blockMapHashRate)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
      <Grid key="txChart" item xs={12} md={6} lg={3}>
        <ChartCard title={t("Transaction count")}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryBar data={blocks.map(blockMapTransactionCount)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
      <Grid key="gasUsed" item xs={12} md={6} lg={3}>
        <ChartCard title={t("Gas Used")}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryBar data={blocks.map(blockMapGasUsed)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
      <Grid key="uncles" item xs={12} md={6} lg={3}>
        <ChartCard title={t("Uncles")}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryBar data={blocks.map(blockMapUncles)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
      <Grid key="BtcPrice" item xs={12} md={6} lg={3}>
        <ChartCard title={t("BTC" + CalculateAggPrice(blocks, 30440, 10))}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryAxis crossAxis standalone={false} />
            <VictoryAxis dependentAxis crossAxis domain={[30200, 30800]} standalone={false} />
            <VictoryLine data={blocks.map(blockMapBtcPrice)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
      <Grid key="ethPrice" item xs={12} md={6} lg={3}>
        <ChartCard title={t("ETH" + CalculateAggPrice(blocks, 1890, 10))}>
          <VictoryChart height={config.chartHeight} width={config.chartWidth} theme={victoryTheme as any}>
            <VictoryAxis crossAxis standalone={false} />
            <VictoryAxis dependentAxis crossAxis domain={[1750, 2000]} standalone={false} />
            <VictoryLine data={blocks.map(blockMapEthPrice)} />
          </VictoryChart>
        </ChartCard>
      </Grid>
    </Grid>
  );
};

export default StatCharts;
