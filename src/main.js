import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import App from "./App.vue";
import router from "./router";

import store from "./store";
import "carbon-components/css/carbon-components.css";
import CarbonComponentsVue from "@carbon/vue/src/index";
import { CarbonIconsVue } from "@carbon/icons-vue";
import TrashCan16 from "@carbon/icons-vue/es/trash-can/16";
import Save16 from "@carbon/icons-vue/es/save/16";
import Download16 from "@carbon/icons-vue/es/download/16";

import Onboard from "bnc-onboard";
import Notify from 'bnc-notify';

import Web3 from "web3";
const ethers = require("ethers");
const https = require("https");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");
const addresses = require("./addresses");
const crucibleABI = require("./artifacts/Crucible");
const crucibleFactoryABI = require("./artifacts/CrucibleFactory");
const transmuterABI = require("./artifacts/TransmuterV1");
const aludelABI = require("./artifacts/Aludel");
const tokenABI = require("./artifacts/ERC20Permit");
const uniswapV2FactoryABI = require("./artifacts/IUniswapV2Factory");
const uniswapV2PairABI = require("./artifacts/IUniswapV2Pair");
const redeemABI = require("./artifacts/Redeem");
const rewardsABI = require("./artifacts/RewardsHypervisor");
const extractABI = require("./artifacts/Extract");
const uniProxyABI = require("./artifacts/UniProxy");
const gammaABI = require("./artifacts/Gamma");
const xGammaABI = require("./artifacts/XGamma");
const sdk = require('@uniswap/v3-sdk');
const sdkCore = require('@uniswap/sdk-core');

import apyCache from "./assets/apyCache";
import { pairIcons, networkInfos } from "./constants";
// import sampleData from './assets/sampleData'
import { SPECIAL_PAIRS, WALLET_PAIRS } from "./constants";

const MILLION = 1;
const THOUSAND = 2;
const PERCENT = 3;

let currentNetworkId = 1;
try {
  currentNetworkId = Number(window.ethereum.chainId);
} catch (error) {
  console.error(error);
}

if (currentNetworkId == 0) currentNetworkId = 1;
// console.log(currentNetworkId);


let net = {};
Object.assign(net, networkInfos[currentNetworkId ? currentNetworkId : 1]);

const uniswapFactoryABI = require("./artifacts/UniswapV3Factory");
const uniswapPoolABI = require("./artifacts/UniswapV3Pool");
const wethABI = require("./artifacts/WETH9");
const hypervisorABI = require("./artifacts/Hypervisor");
const depositProxyABI = require("./artifacts/DepositProxy");
const BigNumber = require("bignumber.js");
const ensSilo = [
  "0xe4f8288e2e7eaee5ac51dc8a8270715156544246",
  // "0xa1e41f1c2f4c30e9738973d7b8e723578578dc36",
  "0x24244ef4839fda2084df4b7c0e4db4d806819cf3",
  "0x973a2ace28745ce4715659c60ef70b9e4c044086",
  "0xa18b1b20be932a9f7a95573731d9b274e0e9d6ba",
  "0xfb229270411803159a621941d0ae8beea656b0be",
  "0x9e653cdedb19674cbe557ac4af6a350001da2688",
  "0x6662034D015eeD5993EaFb7C291B7Ef5eab5E8b2",
  "0x11111171f17d34e7b2486271dd504aedef56d415",
  "0x66a9b4aa270b987054d372d9bcd4e67e0a1dda69",
  "0xf2eb271bd3acae7aead18ff0ec90dae756a645e6",
  // "0x25cb64aa24f560a0719e92f4ebff2876f0da4267",
];

let core = {
  uniProxy: false,
  extract: false,
  silo: ensSilo,
  subsidy: "220462",
  accounts: [],
  addresses: addresses,
  aludels: {},
  tokens: {},
  artifacts:
    net.name !== undefined
      ? {
        Crucible: {
          abi: crucibleABI,
          address: addresses[net.name]["Crucible"]
        },
        CrucibleFactory: {
          abi: crucibleFactoryABI,
          address: addresses[net.name]["CrucibleFactory"]
        },
        Transmuter: {
          abi: transmuterABI,
          address: addresses[net.name]["Transmuter"]
        },
        Aludel: { abi: aludelABI, address: addresses[net.name]["Aludel"] },
        StakingToken: {
          abi: tokenABI,
          address: addresses[net.name]["StakingToken"]
        },
        RewardsToken: {
          abi: tokenABI,
          address: addresses[net.name]["RewardsToken"]
        },
        Redeem: { abi: redeemABI, address: addresses[net.name]["Redeem"] },
        Token0: { abi: tokenABI, address: addresses[net.name]["token0"] },
        Token1: { abi: tokenABI, address: addresses[net.name]["token1"] },
        Weth: { abi: wethABI }
      }
      : undefined,
  freeDeposit: false,
  transmuter: {},
  crucible: false,
  crucibles: [],
  crucibleFactory: {},
  ethUtil: ethUtil,
  sigUtil: sigUtil,
  maxStake: 5000,
  net: {},
  web3: {},
  web4: {},
  signer: {},
  ethersProvider: {},
  ethers: ethers,
  loadedBlock: -1,
  polls: {},
  nfts: [],
  tallies: [],
  tableData: [],
  BN: BigNumber,
  userState: "not_connected",
  states: {
    is_connected: false,
    is_eligible: false,
    is_pending: true,
    redeem: false,
    legacy: false,
    is_current: false,
    is_listed: false
  },
  msg: { type: "empty" },
  apy_percent: "",
  apyCache: apyCache,
  currentPair: "WETH-USDT",
  visorStatsData: null,
  pairs: {
    mainnet: {
      "WETH-USDT": {
        fee: 3000,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 50,
        deposit1Max: 100000,
        icon: pairIcons["ETH-USDT"],
        deposits: false,
        proxy: "0xd4bc3380161420442e7f6b1480fcdc18c7bd814b",
        strategy: "Gamma 1.0",
        status: "Active",
        version: "v1",
        hasAnalytics: false,
      },
      "FLOAT-WETH": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["FLOAT-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Olympus Bond",
        status: "Olympus Bond",
        version: "live",
        hasAnalytics: false,
      },
      "GAMMA-WETH": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["GAMMA-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Olympus Bond",
        status: "Olympus Bond",
        version: "live",
        hasAnalytics: false,
      },
      "0.05% USDC-WETH": {
        fee: 500,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["USDC-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "0.05% WBTC-WETH": {
        fee: 500,
        decimals0: 8,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["WBTC-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "OHMv2-FDT": {
        fee: 10000,
        decimals0: 9,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["OHM-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WETH-BABL": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["ETH-BABL"],
        // proxy: "0xf5bfa20f4a77933fee0c7bb7f39e7642a070d599",
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Babylon Bond",
        status: "Babylon Bond",
        version: "live",
        hasAnalytics: false,
      },
      "FRAX-USDC": {
        fee: 500,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["USDC-FRAX"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "DAI-USDC": {
        fee: 100,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["DAI-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "USDC-USDT": {
        fee: 100,
        decimals0: 6,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["ETH-USDT"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WBTC-renBTC": {
        fee: 500,
        decimals0: 8,
        decimals1: 8,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["WBTC-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "H2O-WETH": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["H2O-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Ocean LM",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "PSDN-WETH": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["PSDN-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Ocean LM",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "OCEAN-PSDN": {
        fee: 10000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["PSDN-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Ocean LM",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "H2O-OCEAN": {
        fee: 10000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        deposits: true,
        icon: pairIcons["H2O-ETH"],
        proxy: "0x83de646a7125ac04950fea7e322481d4be66c71d",
        strategy: "Ocean LM",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
    },
    goerli: {},
    arbitrum: {
      "USDC-WETH": {
        fee: 3000,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-ETH"],
        deposits: true,
        proxy: "0xf874d4957861e193aec9937223062679c14f9aca",
        strategy: "Gamma 1.0",
        status: "Active",
        version: "live",
      },
    },
    polygon: {
      "USDC-WETH": {
        fee: 500,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-WETH": {
        fee: 500,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["MATIC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-WBTC": {
        fee: 500,
        decimals0: 18,
        decimals1: 8,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["WBTC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-USDC": {
        fee: 500,
        decimals0: 8,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WBTC-USDC": {
        fee: 500,
        decimals0: 8,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["WBTC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WETH-USDT": {
        fee: 3000,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["ETH-USDT"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WBTC-WETH": {
        fee: 500,
        decimals0: 8,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["WBTC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "USDC-FRAX": {
        fee: 500,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-FRAX"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WETH-UNI": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["UNI-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-USDT": {
        fee: 500,
        decimals0: 18,
        decimals1: 6,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["ETH-USDT"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-CRV": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["ETH-CRV"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "WMATIC-AAVE": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["AAVE-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "LINK-WETH": {
        fee: 3000,
        decimals0: 18,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["LINK-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "USDC-UST": {
        fee: 500,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "USDC-DAI": {
        fee: 500,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["DAI-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      "USDC-MAI": {
        fee: 100,
        decimals0: 6,
        decimals1: 18,
        deposit0Max: 2500,
        deposit1Max: 2,
        icon: pairIcons["USDC-ETH"],
        deposits: true,
        proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
        strategy: "Gamma 2.0",
        status: "Active",
        version: "live",
        hasAnalytics: true,
      },
      // "USDC-USDT": {
      //   fee: 100,
      //   decimals0: 6,
      //   decimals1: 6,
      //   deposit0Max: 2500,
      //   deposit1Max: 2,
      //   icon: pairIcons["ETH-USDT"],
      //   deposits: true,
      //   proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
      //   strategy: "Gamma 2.0",
      //   status: "Active",
      //   version: "live",
      //   hasAnalytics: true,
      // },
      // "FRAX-MAI": {
      //   fee: 500,
      //   decimals0: 18,
      //   decimals1: 18,
      //   deposit0Max: 2500,
      //   deposit1Max: 2,
      //   icon: pairIcons["USDC-FRAX"],
      //   deposits: true,
      //   proxy: "0xe339ecc9deef6b69dbc394abf6fbff19450faeb6",
      //   strategy: "Gamma 2.0",
      //   status: "Active",
      //   version: "live",
      //   hasAnalytics: true,
      // }
    },
    arbitrumTestnet: {},
    optimistic: {}
  },
  uniswapv3: {
    hypes: {},
    factory: false,
    balanceETH: 0,
    pairs: [],
    fees: {}
  },
  nonUser: false,
  shareOfSupplyNonUser: false,
  keepSignin: false,
  onboard: null,
  notify: null,
  publish: true,
  pollTxInstance: {},
  version: "main",

  /**
   * Initialize the core data for new network initialization
   */
  initializeCoreData() {
    this.artifacts = {
      Crucible: { abi: crucibleABI, address: addresses[this.net.name]["Crucible"] },
      CrucibleFactory: {
        abi: crucibleFactoryABI,
        address: addresses[this.net.name]["CrucibleFactory"]
      },
      Transmuter: {
        abi: transmuterABI,
        address: addresses[this.net.name]["Transmuter"]
      },
      Aludel: { abi: aludelABI, address: addresses[this.net.name]["Aludel"] },
      StakingToken: {
        abi: tokenABI,
        address: addresses[this.net.name]["StakingToken"]
      },
      RewardsToken: {
        abi: tokenABI,
        address: addresses[this.net.name]["RewardsToken"]
      },
      Redeem: { abi: redeemABI, address: addresses[this.net.name]["Redeem"] },
      Token0: { abi: tokenABI, address: addresses[this.net.name]["token0"] },
      Token1: { abi: tokenABI, address: addresses[this.net.name]["token1"] }
    };
    const sampleTableData = [
      ["xGAMMA", "0.00", "Gamma 1.0", "-", "-", "Active"],
      ["GAMMA", "0.00", "Gamma 1.0", "-", "-", "Fee Migration"],
      ...Object.keys(this.pairs[this.net.name])
        .map(pair => [
          this.translateWETH(pair, true),
          "0.00",
          this.pairs[this.net.name][pair].strategy,
          // this.isSpecialPair(this.translateWETH(pair))
          //   ? "Olympus Bond"
          //   : "Gamma 1.0",
          "0.00",
          "-",
          this.pairs[this.net.name][pair].status,
          // "Open Beta"
        ])
        .reverse()
    ];

    this.accounts = [];
    this.aludels = {};
    this.tokens = {};
    this.transmuter = {};
    this.crucible = false;
    this.crucibles = [];
    this.crucibleFactory = {};
    this.polls = {};
    this.nfts = [];
    this.tallies = [];

    this.userState = "not_connected";

    this.tableData = sampleTableData;

    this.states = {
      is_connected: false,
      is_eligible: false,
      is_pending: true,
      redeem: false,
      legacy: false,
      is_current: false,
      is_listed: false
    };
    this.uniswapv3 = {
      hypes: {},
      factory: false,
      balanceETH: 0,
      pairs: [],
      fees: {}
    };
    this.nonUser = false;
    this.shareOfSupplyNonUser = false;
    this.keepSignin = false;

    this.crucibleQuery = new this.web4.eth.Contract(
      this.artifacts["CrucibleFactory"].abi,
      this.artifacts["CrucibleFactory"].address
    );
    const web3Url = "https://" + net.name + ".infura.io/v3/" + process.env.VUE_APP_INFURA_KEY;
    this.web3 = this.web4 = new Web3(Web3.givenProvider || web3Url);
    // this.onboard.walletReset();
  },

	/******************************************************************
	 * Converts e-Notation Numbers to Plain Numbers
	 ******************************************************************
	 * @function this.eToNumber(number)
	 * @version  1.00
	 * @param   {e nottation Number} valid Number in exponent format.
	 *          pass number as a string for very large 'e' numbers or with large fractions
	 *          (none 'e' number returned as is).
	 * @return  {string}  a decimal number string.
	 * @author  Mohsen Alyafei
	 * @date    17 Jan 2020
	 * Note: No check is made for NaN or undefined input numbers.
	 *
	 *****************************************************************/
	 eToNumber(num) {
		let sign = "";
		(num += "").charAt(0) == "-" && (num = num.substring(1), sign = "-");
		let arr = num.split(/[e]/ig);
		if (arr.length < 2) return sign + num;
		let dot = (.1).toLocaleString().substr(1, 1), n = arr[0], exp = +arr[1],
				w = (n = n.replace(/^0+/, '')).replace(dot, ''),
			pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp,
			L   = pos - w.length, s = "" + BigInt(w);
			w   = exp >= 0 ? (L >= 0 ? s + "0".repeat(L) : r()) : (pos <= 0 ? "0" + dot + "0".repeat(Math.abs(pos)) + s : r());
		L= w.split(dot); if (L[0]==0 && L[1]==0 || (+w==0 && +s==0) ) w = 0; //** added 9/10/2021
		return sign + w;
		function r() {return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`)}
	},
  
  async preInitializeAludel(stakingToken) {
    //choose staking token rewards
    this.aludels[stakingToken] = await new this.web3.eth.Contract(
      this.artifacts["Aludel"].abi,
      this.addresses[this.net.name][stakingToken + "-Aludel"]
    );
  },
  async preInitializeStakingToken(stakingToken) {
    //choose staking token
    this.tokens[stakingToken] = await new this.web3.eth.Contract(
      this.artifacts["StakingToken"].abi,
      this.addresses[this.net.name][stakingToken]
    );
  },
  async initializeExtract() {
    //choose staking token
    this.extract = await new this.web3.eth.Contract(
      extractABI,
      this.addresses[this.net.name].Extract
    );
  },

  async preSignin(onDashboard = true) {
    // assign instance of web3
    Object.assign(this.web3, this.web4);

    // await core.initializeFactory();
    this.crucibleFactory = await new this.web3.eth.Contract(
      this.artifacts["CrucibleFactory"].abi,
      this.artifacts["CrucibleFactory"].address
    );

    // Transmuter Initialization
    this.transmuter = await new this.web3.eth.Contract(
      this.artifacts["Transmuter"].abi,
      this.artifacts["Transmuter"].address
    );

    for (let i = 0; i < this.tableData.length; i++) {
      await this.preInitializeAludel(this.tableData[i][0]);
      await this.preInitializeStakingToken(this.tableData[i][0]);
    }

    // add vVISR
    await this.preInitializeStakingToken("xGAMMA");
    await this.updateEndpoint();

    // if (this.net.api1)
    //   this.nonUser = await fetch(this.net.api1 + "/hypervisors/allData")
    //     .then(response => response.json())
    //     .catch(() => {
    //       return fetch(this.net.api2 + "/hypervisors/allData")
    //         .then(response => response.json())
    //         .catch(() => false);
    //     });
    // this.latestApys = await fetch(this.net.api1 + "/hypervisors/returns")
    //   .then(response => response.json())
    //   .catch(() => {
    //     return fetch(this.net.api2 + "/hypervisors/returns").then(response =>
    //       response.json()
    //     ).catch(() => false);
    //   });

    await this.initializeExtract();

    if (onDashboard && this.net.version !== "beta") {
      await this.initializeV3();
      await this.initializeV3Pools();
    }

    // InitializeRewardsHypervisor
    // if (this.net.name === "mainnet")
    await this.initializeRewardsHypervisor();
    // console.log("the Presignin is done for current network");
  },
  async initializingDashboard() {
    await this.initializeV3();
    await this.initializeV3Pools();
  },
  async initializeV3Pools() {
    const arraysOfPromises = Object.keys(this.pairs[this.net.name]).map(pair => {
      if (!this.uniswapv3.hypes[pair]) {
        this.uniswapv3.fees[pair] = this.pairs[this.net.name][pair].fee;
        return this.initializeV3Pool(pair);
      }
    });
    await Promise.all(arraysOfPromises);
  },
  async initializeV3PoolsUser() {
    // await this.updateEndpoint();
    const arraysOfPromises = Object.keys(this.pairs[this.net.name]).map(pair =>
      this.initializeV3PoolUser(pair)
    );
    await Promise.all(arraysOfPromises);
  },
  async initializeV3Pool(pair) {
    this.uniswapv3.hypes[pair] = {};
    Object.assign(this.uniswapv3.hypes[pair], this.pairs[this.net.name][pair] || {});
    this.uniswapv3.pairs.push(pair);
    let labels = pair.split("-");

    this.uniswapv3.hypes[pair]["label0"] = labels[0];
    this.uniswapv3.hypes[pair]["label1"] = labels[1];
    this.uniswapv3.hypes[pair]["token0Address"] = this.addresses[this.net.name][
      labels[0]
    ];
    this.uniswapv3.hypes[pair]["token1Address"] = this.addresses[this.net.name][
      labels[1]
    ];
    this.uniswapv3.hypes[pair]["hypeAddress"] = this.addresses[this.net.name][
      addresses[this.net.name][pair]
    ];

    // initalize tokens
    this.uniswapv3.hypes[pair]["token0"] = await new this.web3.eth.Contract(
      labels[0] == "WETH" ? wethABI : tokenABI,
      this.addresses[this.net.name][labels[0]]
    );
    this.uniswapv3.hypes[pair]["token1"] = await new this.web3.eth.Contract(
      labels[1] == "WETH" ? wethABI : tokenABI,
      this.addresses[this.net.name][labels[1]]
    );
    this.uniswapv3.hypes[pair]["hype"] = await new this.web3.eth.Contract(
      hypervisorABI,
      addresses[this.net.name][pair]
    );

    /*PROXY*/
    // if (this.pairs[this.net.name][pair].proxy) {
    
    if (!this.uniProxy) {
      this.uniProxy = await new this.web3.eth.Contract(
        uniProxyABI,
        this.pairs[this.net.name][pair].proxy
      );
    }
    this.uniswapv3.hypes[pair]["proxy"] = this.uniProxy;

    // if (this.isSpecialPair(pair)) {
    //   this.uniswapv3.hypes[pair]["proxy"] = await new this.web3.eth.Contract(
    //     depositProxyABI,
    //     this.pairs[this.net.name][pair].proxy
    //   );
    // } else {
    //   if (!this.uniProxy) {
    //     this.uniProxy = await new this.web3.eth.Contract(
    //       uniProxyABI,
    //       this.pairs[this.net.name][pair].proxy
    //     );
    //   }
    //   this.uniswapv3.hypes[pair]["proxy"] = this.uniProxy;
    // }

    // this.nonUser = false;
    if (this.nonUser && this.nonUser[addresses[this.net.name][pair]]) {
      let uniswapPoolAddress = this.nonUser[addresses[this.net.name][pair]]
        .poolAddress;
      this.uniswapv3.hypes[pair]["pool"] = await new this.web3.eth.Contract(
        uniswapPoolABI,
        uniswapPoolAddress
      );
      this.uniswapv3.hypes[pair]["decimals0"] = this.nonUser[
        addresses[this.net.name][pair]
      ].decimals0;
      this.uniswapv3.hypes[pair]["decimals1"] = this.nonUser[
        addresses[this.net.name][pair]
      ].decimals1;

      this.uniswapv3.hypes[pair]["price"] = this.tickToPrice(
        this.nonUser[addresses[this.net.name][pair]].tick,
        this.uniswapv3.hypes[pair].decimals0,
        this.uniswapv3.hypes[pair].decimals1
      );
      if (pair == "WETH-ENS") {
        let base = await this.web3Call(
          this.uniswapv3.hypes[pair].hype.methods.getBasePosition
        )
        // let base = await this.uniswapv3.hypes[pair].hype.methods
        //   .getBasePosition()
        //   .call();
        // console.log(base);
        // let unused0 = await this.uniswapv3.hypes[pair].token0.methods
        //   .balanceOf(this.uniswapv3.hypes[pair].hype._address)
        //   .call();
        // let unused1 = await this.uniswapv3.hypes[pair].token1.methods
        //   .balanceOf(this.uniswapv3.hypes[pair].hype._address)
        //   .call();

        let unused0 = await this.web3Call(
          this.uniswapv3.hypes[pair].token0.methods.balanceOf,
          true,
          [this.uniswapv3.hypes[pair].hype._address]
        );
        let unused1 = await this.web3Call(
          this.uniswapv3.hypes[pair].token1.methods.balanceOf,
          true,
          [this.uniswapv3.hypes[pair].hype._address]
        );

        let total0 = this.BN(base.amount0).plus(this.BN(unused0));
        let total1 = this.BN(base.amount1).plus(this.BN(unused1));

        // console.log(total0, total0.toString());
        // console.log(total1, total1.toString());

        this.uniswapv3.hypes[pair]["totals"] = {
          total0: total0,
          total1: total1
        };
      } else {
        this.uniswapv3.hypes[pair]["totals"] = {
          total0: this.BN(
            this.nonUser[addresses[this.net.name][pair]].tvl0
          ).multipliedBy(
            Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0))
          ),
          total1: this.BN(
            this.nonUser[addresses[this.net.name][pair]].tvl1
          ).multipliedBy(
            Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1))
          )
        };
      }
      // this.uniswapv3.hypes[pair]["totals"] = {
      //   total0: this.BN(
      //     this.nonUser[addresses[this.net.name][pair]].tvl0
      //   ).multipliedBy(
      //     Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0))
      //   ),
      //   total1: this.BN(
      //     this.nonUser[addresses[this.net.name][pair]].tvl1
      //   ).multipliedBy(
      //     Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1))
      //   )
      // };

      this.uniswapv3.hypes[pair]["totalSupply"] = this.nonUser[
        addresses[this.net.name][pair]
      ].totalSupply;

      /*PROXY*/

      this.uniswapv3.hypes[pair]["maxTotalSupply"] = this.nonUser[
        addresses[this.net.name][pair]
      ].maxTotalSupply;

      if (pair == "WETH-ENS" )
        this.uniswapv3.hypes[pair]["tvl"] = await this.getTVLUSD(pair);
      else
        this.uniswapv3.hypes[pair]["tvl"] = this.nonUser[
          addresses[this.net.name][pair]
        ].tvlUSD;

    } else {
      // If nonUser endpoint is down
      // console.log("NonUser is down");
      // let uniswapPoolAddress = await this.uniswapv3.factory.methods
      //   .getPool(
      //     this.addresses[this.net.name][labels[0]],
      //     this.addresses[this.net.name][labels[1]],
      //     this.uniswapv3.fees[pair]
      //   )
      //   .call();

      let uniswapPoolAddress = await this.web3Call(
        this.uniswapv3.factory.methods.getPool,
        true,
        [
          this.addresses[this.net.name][labels[0]],
          this.addresses[this.net.name][labels[1]],
          this.uniswapv3.fees[pair]
        ]
      );

      this.uniswapv3.hypes[pair]["pool"] = await new this.web3.eth.Contract(
        uniswapPoolABI,
        uniswapPoolAddress
      );
      this.uniswapv3.hypes[pair]["decimals0"] = await this.web3Call(
        this.uniswapv3.hypes[pair].token0.methods.decimals
      );
      this.uniswapv3.hypes[pair]["decimals1"] = await this.web3Call(
        this.uniswapv3.hypes[pair].token1.methods.decimals
      );
      this.uniswapv3.hypes[pair]["slot0"] = await this.web3Call(
        this.uniswapv3.hypes[pair].pool.methods.slot0
      );

      if (!this.uniswapv3.hypes[pair].slot0)
        this.uniswapv3.hypes[pair].slot0 = {
          tick : 0
        };

      this.uniswapv3.hypes[pair]["price"] = this.tickToPrice(
        this.uniswapv3.hypes[pair].slot0.tick,
        this.uniswapv3.hypes[pair].decimals0,
        this.uniswapv3.hypes[pair].decimals1
      );
      this.uniswapv3.hypes[pair]["totals"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.getTotalAmounts
      );
      this.uniswapv3.hypes[pair]["totalSupply"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.totalSupply
      );
      this.uniswapv3.hypes[pair]["tvl"] = await this.getTVLUSD(pair);
      // console.log(this.uniswapv3.hypes[pair], pair);
    }
    // console.log(this.latestApys, this.apyCache[addresses[this.net.name][pair]]);
    if (
      this.latestApys &&
      typeof this.latestApys[addresses[this.net.name][pair]] != "undefined"
    ) {
      this.uniswapv3.hypes[pair]["apy"] = (
        this.latestApys[addresses[this.net.name][pair]].weekly.feeApr * 100
      ).toFixed(2);
    } else if (this.apyCache[addresses[this.net.name][pair]]) {
      this.uniswapv3.hypes[pair]["apy"] = (
        this.apyCache[addresses[this.net.name][pair]].weekly.feeApr * 100
      ).toFixed(2);
    } else if (this.nonUser[addresses[this.net.name][pair]]) {
      this.uniswapv3.hypes[pair]["apy"] = (
      this.nonUser[addresses[this.net.name][pair]].weekly.feeApr * 100
      ).toFixed(2);
    }
    this.uniswapv3.hypes[pair]["deposit0Max"] =
      (await this.uniswapv3.hypes[pair].hype.methods.deposit0Max().call()) /
      Math.pow(10, this.uniswapv3.hypes[pair]["decimals0"]) -
      (this.uniswapv3.hypes[pair]["label0"] === "WBTC" ? 0.00000001 : 0);

    this.uniswapv3.hypes[pair]["deposit1Max"] =
      (await this.uniswapv3.hypes[pair].hype.methods.deposit1Max().call()) /
      Math.pow(10, this.uniswapv3.hypes[pair]["decimals1"]) -
      (this.uniswapv3.hypes[pair]["label1"] === "WBTC" ? 0.00000001 : 0);
    this.uniswapv3.hypes[pair]["hypeAddress"] = addresses[this.net.name][pair];

    this.uniswapv3.hypes[pair]["token0Address"] =
      addresses[this.net.name][labels[0]];

    this.uniswapv3.hypes[pair]["token1Address"] =
      addresses[this.net.name][labels[1]];

    // console.log(this.uniswapv3.hypes[pair]);
  },
  async initializeV3PoolBackup(pair) {
    this.uniswapv3.hypes[pair] = {};
    this.uniswapv3.pairs.push(pair);
    let labels = pair.split("-");
    this.uniswapv3.hypes[pair]["label0"] = labels[0];
    this.uniswapv3.hypes[pair]["label1"] = labels[1];
    // initalize tokens
    this.uniswapv3.hypes[pair]["token0"] = await new this.web3.eth.Contract(
      labels[0] == "WETH" ? wethABI : tokenABI,
      this.addresses[this.net.name][labels[0]]
    );
    this.uniswapv3.hypes[pair]["token1"] = await new this.web3.eth.Contract(
      labels[1] == "WETH" ? wethABI : tokenABI,
      this.addresses[this.net.name][labels[1]]
    );

    this.uniswapv3.hypes[pair]["hype"] = await new this.web3.eth.Contract(
      hypervisorABI,
      addresses[this.net.name][pair]
    );

    let uniswapPoolAddress;

    if (this.nonUser && this.nonUser[addresses[this.net.name][pair]])
      uniswapPoolAddress = this.nonUser[addresses[this.net.name][pair]].poolAddress;
    else
      uniswapPoolAddress = await this.web3Call(
        this.uniswapv3.factory.methods.getPool,
        true,
        [
          this.addresses[this.net.name][labels[0]],
          this.addresses[this.net.name][labels[1]],
          this.uniswapv3.fees[pair]
        ]
      );
    

    this.uniswapv3.hypes[pair]["pool"] = await new this.web3.eth.Contract(
      uniswapPoolABI,
      uniswapPoolAddress
    );
    this.uniswapv3.hypes[pair]["decimals0"] = await this.web3Call(
      this.uniswapv3.hypes[pair].token0.methods.decimals,
    );
    this.uniswapv3.hypes[pair]["decimals1"] = await this.web3Call(
      this.uniswapv3.hypes[pair].token1.methods.decimals,
    );
    this.uniswapv3.hypes[pair]["slot0"] = await this.web3Call(
      this.uniswapv3.hypes[pair].pool.methods.slot0,
    );
    this.uniswapv3.hypes[pair]["price"] = this.tickToPrice(
      this.uniswapv3.hypes[pair].slot0.tick,
      this.uniswapv3.hypes[pair].decimals0,
      this.uniswapv3.hypes[pair].decimals1
    );
    this.uniswapv3.hypes[pair]["totals"] = await this.web3Call(
      this.uniswapv3.hypes[pair]["hype"].methods.getTotalAmounts
    );
    this.uniswapv3.hypes[pair]["totalSupply"] = await this.web3Call(
      this.uniswapv3.hypes[pair]["hype"].methods.totalSupply
    );
    this.uniswapv3.hypes[pair]["tvl"] = await this.getTVLUSD(pair);

    if (typeof this.latestApys[addresses[this.net.name][pair]] != "undefined") {
      this.uniswapv3.hypes[pair]["apy"] = (
        this.latestApys[addresses[this.net.name][pair]].weekly.feeApy * 100
      ).toFixed(2);
    } else if (typeof this.nonUser[addresses[this.net.name][pair]] != "undefined") {
      this.uniswapv3.hypes[pair]["apy"] = (
        this.apyCache[addresses[this.net.name][pair]].weekly.feeApy * 100
      ).toFixed(2);
    } else {
      this.uniswapv3.hypes[pair]["apy"] = (
        this.apyCache[addresses[this.net.name][pair]].weekly.feeApy * 100
      ).toFixed(2);
    }
  },

  async initializeV3PoolUserBackup(pair) {
    // console.log("-------- before  ", pair, "--------");
    // console.log(this.uniswapv3.hypes[pair]["shares"]);
    // console.log("initializeV3PoolUserBackup func called");
    let key = this.uniswapv3.hypes[pair].hype._address.toLowerCase();
    if (this.net.number == 1 && this.shareOfSupplyNonUser) {
      this.uniswapv3.hypes[pair]["balance0"] = this.shareOfSupplyNonUser[key] ? this.shareOfSupplyNonUser[key].balance0 : 0;
      this.uniswapv3.hypes[pair]["balance1"] = this.shareOfSupplyNonUser[key] ? this.shareOfSupplyNonUser[key].balance1 : 0;
      this.uniswapv3.hypes[pair]["shares"] = this.shareOfSupplyNonUser[key] ? this.shareOfSupplyNonUser[key].shares : 0;

      if (this.isWalletPair(this.translateWETH(pair))) {
        this.uniswapv3.hypes[pair]["balance0"] = await this.web3Call(
          this.uniswapv3.hypes[pair].token0.methods.balanceOf,
          true,
          [this.accounts[0]]
        );
        this.uniswapv3.hypes[pair]["balance1"] = await this.web3Call(
          this.uniswapv3.hypes[pair].token1.methods.balanceOf,
          true,
          [this.accounts[0]]
        );
        this.uniswapv3.hypes[pair]["shares"] = await this.web3Call(
          this.uniswapv3.hypes[pair]["hype"].methods.balanceOf,
          true,
          [this.accounts[0]]
        );
      }
    } else {
      this.uniswapv3.hypes[pair]["balance0"] = await this.web3Call(
        this.uniswapv3.hypes[pair].token0.methods.balanceOf,
        true,
        [this.accounts[0]]
      );
      this.uniswapv3.hypes[pair]["balance1"] = await this.web3Call(
        this.uniswapv3.hypes[pair].token1.methods.balanceOf,
        true,
        [this.accounts[0]]
      );
      this.uniswapv3.hypes[pair]["shares"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.balanceOf,
        true,
        [this.accounts[0]]
      );
    }
    // console.log("after");
    // console.log(this.uniswapv3.hypes[pair]["shares"]);

    this.uniswapv3.hypes[pair]["totalSupply"] = await this.web3Call(
      this.uniswapv3.hypes[pair]["hype"].methods.totalSupply,
      true,
      []
    );

    this.uniswapv3.hypes[pair]["shares"] = this.uniswapv3.hypes[pair]["shares"] ? this.uniswapv3.hypes[pair]["shares"] : 0;

    this.uniswapv3.hypes[pair]["perc"] = this.BN(
      this.uniswapv3.hypes[pair]["shares"]
    ).div(this.BN(this.uniswapv3.hypes[pair]["totalSupply"] ? this.uniswapv3.hypes[pair]["totalSupply"] : 1));

    this.uniswapv3.hypes[pair]["perc_share"] = this.uniswapv3.hypes[pair][
      "perc"
    ]
      .times(this.BN(100))
      .toFixed(3);
      
    if (pair == "WETH-ENS" && !this.silo.includes(this.accounts[0])) {
      this.uniswapv3.hypes[pair]["value"] = this.BN(
        this.uniswapv3.hypes[pair].perc
      )
        .times(this.BN(this.uniswapv3.hypes[pair].tvl))
        .plus(
          this.BN(this.uniswapv3.hypes[pair].perc).times(this.BN(this.subsidy))
        )
        .toFixed(2);
    } else {
      this.uniswapv3.hypes[pair]["value"] = this.BN(
        this.uniswapv3.hypes[pair].perc
      )
        .times(this.BN(this.uniswapv3.hypes[pair].tvl))
        .toFixed(2);
    }

    // console.log("------ " + pair + " -------");
    // console.log("shares : " + this.uniswapv3.hypes[pair]["shares"]);
    // console.log("totalSupply : " + this.uniswapv3.hypes[pair]["totalSupply"]);
    // console.log("perc :" + this.uniswapv3.hypes[pair]["perc"].toFixed(2));
    // console.log(this.silo.includes(this.accounts[0]), this.accounts[0]);
    // console.log("perc, tvl, value " + pair, this.uniswapv3.hypes[pair].perc.toString(), this.uniswapv3.hypes[pair].tvl.toString(), this.uniswapv3.hypes[pair]["value"])

    // this.uniswapv3.hypes[pair]["value"] = this.BN(
    //   this.uniswapv3.hypes[pair].perc
    // )
    //   .times(this.BN(this.uniswapv3.hypes[pair].tvl))
    //   .toFixed(2);
    // console.log(this.uniswapv3.hypes[pair]);
  },
  isSpecialPair(pair) {
    return SPECIAL_PAIRS.includes(pair);
  },
  isWalletPair(pair) {
    if (this.version == "main") return true;
    return WALLET_PAIRS.includes(pair);
  },
  async getUserPosition(pair) {
    let key = this.uniswapv3.hypes[pair].hype._address.toLowerCase();
    let totalSupply = await this.web3Call(
      this.uniswapv3.hypes[pair]["hype"].methods.totalSupply
    );

    let userAmount0 = this.BN(0);
    let userAmount1 = this.BN(0);

    if (this.uniswapv3.hypes[pair].totals) {
      userAmount0 = this.BN(this.uniswapv3.hypes[pair].totals.total0)
        .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0)))
        .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
        .div(totalSupply);
      userAmount1 = this.BN(this.uniswapv3.hypes[pair].totals.total1)
        .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1)))
        .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
        .div(totalSupply);
    }

    if (parseInt(this.uniswapv3.hypes[pair].value) === 0) {
      this.uniswapv3.hypes[pair].userAmount0 = 0;
      this.uniswapv3.hypes[pair].userAmount1 = 0;
    } else if (this.uniswapv3.hypes[pair].label0 === "WETH") {
      this.uniswapv3.hypes[pair].userAmount0 = userAmount0
        .times(this.BN(this.ethPrice))
        .div(this.uniswapv3.hypes[pair].value);
      this.uniswapv3.hypes[pair].userAmount1 =
        1 - this.uniswapv3.hypes[pair].userAmount0;
    } else if (this.uniswapv3.hypes[pair].label1 === "WETH") {
      this.uniswapv3.hypes[pair].userAmount1 = userAmount1
        .times(this.BN(this.ethPrice))
        .div(this.uniswapv3.hypes[pair].value);
      this.uniswapv3.hypes[pair].userAmount0 =
        1 - this.uniswapv3.hypes[pair].userAmount1;
    } else {
      if (this.nonUser){
        let address = this.uniswapv3.hypes[pair].hype._address.toLowerCase();
        let tick = this.nonUser[address].tick;
        let token0ToToken1 = this.tickToPrice(tick, this.uniswapv3.hypes[pair].decimals0, this.uniswapv3.hypes[pair].decimals1);
        let tvl0 = this.nonUser[address].tvl0;
        let tvl1 = this.nonUser[address].tvl1;
        this.uniswapv3.hypes[pair].userAmount1 = this.BN(tvl1 / (tvl0 * token0ToToken1 + tvl1));
        this.uniswapv3.hypes[pair].userAmount0 = 1 - this.uniswapv3.hypes[pair].userAmount1;
      }
    }
    // console.log(this.uniswapv3.hypes[pair])
    // console.log(this.uniswapv3.hypes[pair].tvl)
  },
  async initializeV3PoolUser(pair) {
    if (
      this.shareOfSupplyNonUser &&
      Object.keys(this.shareOfSupplyNonUser).length &&
      this.shareOfSupplyNonUser[addresses[this.net.name][pair]] &&
      !this.isWalletPair(pair)
    ) {
      this.uniswapv3.hypes[pair].balance0 = this.shareOfSupplyNonUser[
        addresses[this.net.name][pair]
      ].balance0;
      this.uniswapv3.hypes[pair].balance1 = this.shareOfSupplyNonUser[
        addresses[this.net.name][pair]
      ].balance1;
      this.uniswapv3.hypes[pair].shares = this.shareOfSupplyNonUser[
        addresses[this.net.name][pair]
      ].shares;
      this.uniswapv3.hypes[pair].totalSupply = this.shareOfSupplyNonUser[
        addresses[this.net.name][pair]
      ].totalSupply;
      this.uniswapv3.hypes[pair]["perc"] = this.BN(
        this.uniswapv3.hypes[pair]["shares"]
      ).div(this.BN(this.uniswapv3.hypes[pair]["totalSupply"] ? this.uniswapv3.hypes[pair]["totalSupply"] : 1));
      // this.uniswapv3.hypes[pair].perc = this.BN(
      //   this.shareOfSupplyNonUser[addresses[this.net.name][pair]].shareOfSupply
      // )
      //   .times(this.BN(100))
      //   .toFixed(3);
      this.uniswapv3.hypes[pair].value = this.BN(
        this.uniswapv3.hypes[pair].perc
      )
        .times(this.BN(this.uniswapv3.hypes[pair].tvl))
        .toFixed(2);
      this.uniswapv3.hypes[pair]["perc_share"] = this.uniswapv3.hypes[pair][
        "perc"
      ]
        .times(this.BN(100))
        .toFixed(3);
    } else {
      await this.initializeV3PoolUserBackup(pair);
    // } else {
    //   if (this.uniswapv3.hypes[pair] === undefined)
    //     this.uniswapv3.hypes[pair] = {}
    //   this.uniswapv3.hypes[pair].balance0 = 0;
    //   this.uniswapv3.hypes[pair].balance1 = 0;
    //   this.uniswapv3.hypes[pair].shares = 0;
    //   this.uniswapv3.hypes[pair]["perc"] = 0;
    //   this.uniswapv3.hypes[pair].value = 0;
    //   this.uniswapv3.hypes[pair]["perc_share"] = 0;
    }
    await this.getUserPosition(pair);
  },

  async updateUserLP(pair) {
    await this.initializeV3PoolUserBackup(pair);
    await this.getUserPosition(pair);
  },
  isLP(pair) {
    let lpPair = this.translateWETH(pair, false);
    return this.uniswapv3.pairs.indexOf(lpPair) != -1;
  },
  depositActive(pair) {
    if (pair == "GAMMA") return false;
    
    return this.isLP(pair);
  },
  withdrawActive(pair) {
    return (
      pair == "VISR-ETH" ||
      pair == "USDT" ||
      pair == "USDC" ||
      pair == "DAI" ||
      pair == "GAMMA" ||
      pair == "xGAMMA" ||
      this.depositActive(pair)
    );
  },
  translateWETH(pair, invert) {
    // if(!pair) return pair
    let parts = pair.split("-");
    if (invert) {
      if (parts[0] == "WETH") parts[0] = "ETH";
      if (parts[1] == "WETH") parts[1] = "ETH";
    } else {
      if (parts[0] == "ETH") parts[0] = "WETH";
      if (parts[1] == "ETH") parts[1] = "WETH";
    }
    return parts.join("-");
  },
  async getTVLUSD(pair) {
    let tvl;
    let token0InToken1 = this.BN(this.uniswapv3.hypes[pair].totals.total0)
      .times(this.BN(this.uniswapv3.hypes[pair].price))
      .div(this.BN(10).pow(this.BN(this.uniswapv3.hypes[pair].decimals0)));

    if (pair == "WETH-USDT") {
      let total1Adj = this.BN(this.uniswapv3.hypes[pair].totals.total1).div(
        this.BN(10).pow(this.BN(this.uniswapv3.hypes[pair].decimals1))
      );
      tvl = token0InToken1.plus(total1Adj);
    } else {
      let parts = pair.split("-");
      if (parts[1] == "WETH") {
        let total1Adj = this.BN(this.uniswapv3.hypes[pair].totals.total1).div(
          this.BN(10).pow(this.BN(this.uniswapv3.hypes[pair].decimals1))
        );
        // console.log(this.ethPrice);
        tvl = token0InToken1.plus(total1Adj).times(this.ethPrice);
        // console.log(total1Adj, tvl);
      } else if (parts[0] == "WETH") {
        let inWETH = this.BN(1).div(this.BN(this.uniswapv3.hypes[pair].price));
        let token1InToken0 = inWETH.times(
          this.BN(this.uniswapv3.hypes[pair].totals.total1)
        );
        let totalWETH = token1InToken0.plus(
          this.BN(this.uniswapv3.hypes[pair].totals.total0)
        );

        tvl = totalWETH
          .times(this.ethPrice)
          .div(this.BN(10).pow(this.BN(this.uniswapv3.hypes[pair].decimals0)));
      } else {
        console.log("GET TVL: Exception Mode");
        await this.updateEndpoint();
        if (this.nonUser){
          let address = this.uniswapv3.hypes[pair].hype._address.toLowerCase();
          tvl = this.nonUser[address].tvlUSD;
        }
      }
    }
    return tvl;
  },
  async initializeV3() {
    this.uniswapv3.factory = await new this.web3.eth.Contract(
      uniswapFactoryABI,
      addresses[this.net.name]["UniswapV3Factory"]
    );
    if (
      !this.addresses[this.net.name]["WETH"] ||
      !this.addresses[this.net.name]["USDT"]
    )
      return;
    let ethusdAddress;
    if (this.nonUser && this.nonUser[addresses[this.net.name]["WETH-USDT"]])
      ethusdAddress = this.nonUser[addresses[this.net.name]["WETH-USDT"]].poolAddress;
    else
      ethusdAddress = await this.uniswapv3.factory.methods
        .getPool(
          this.addresses[this.net.name]["WETH"],
          this.addresses[this.net.name]["USDT"],
          3000
        )
        .call();
    // if(typeof this.uniswapv3.hypes['WETH-USDT'] == undefined) {
    let pool = await new this.web3.eth.Contract(uniswapPoolABI, ethusdAddress);
    
    // console.log(pool);
    if (ethusdAddress == "0x0000000000000000000000000000000000000000") {
      this.ethPrice = this.ethPrice ? this.ethPrice : 4500;
      return;
    }
    let slot0 = await this.web3Call(pool.methods.slot0);
    // let slot0 = await pool.methods.slot0().call();
    this.ethPrice = this.tickToPrice(slot0.tick, 18, 6);
  },

  tickToPrice(tick, decimals0, decimals1) {
    // note the change of logarithmic base
    return Math.pow(1.0001, tick) / Math.pow(10, decimals1 - decimals0);
  },
  async connect(override, previousSelectedWallet = null, walletChange = false) {
    // the case that local storage has the previous selected wallet.
    let walletSelected;
    if (previousSelectedWallet && !walletChange)
      walletSelected = await this.onboard.walletSelect(previousSelectedWallet);
    else walletSelected = await this.onboard.walletSelect();

    if (!walletSelected) return false;

    // update the web3 after selection
    let curWalletState = this.onboard.getState().wallet;

    const res = await this.onboard.walletCheck();
    if (!res) return false;

    // updation ended
    try {
      this.accounts = await this.directWeb3Call(this.web3.eth.getAccounts);
      this.accounts[0] = this.accounts[0].toLowerCase();
    } catch (err) {
      this.connect(override, null, true);
    }
    if (curWalletState.name == previousSelectedWallet && walletChange) return;

    window.localStorage.setItem("visorSelectedWallet", curWalletState.name);



    this.states.is_connected = true;
    this.states.is_pending = true;

    this.accounts = await this.directWeb3Call(this.web3.eth.getAccounts);
    this.accounts[0] = this.accounts[0].toLowerCase();
    this.loadedBlock = await this.directWeb3Call(this.web3.eth.getBlockNumber);
    /**
     * This snippet is on the preSign func
     * */

    // await this.initializeFactory();

    this.states.is_pending = false;
    if (this.checkAddress()) {
      this.states.is_eligible = true;
    }

    /**
     * This snippet is on the preSign func
     * */

    // await this.initializeTransmuter();
    // await this.initializeRewards();

    // await this.initializeRedeem();
    if (this.net.name == "mainnet") await this.initializeUniswap();
    this.max = this.web3.utils
      .toBN("999999999999999999999999999")
      .mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(18)));

    await this.initializeV3PoolsUser();
    /**
     * This snippet is on the preSign func
     * */
    // await this.initializeRewardsHypervisor();

    this.uniswapv3.balanceETH = await this.directWeb3Call(
      this.web3.eth.getBalance,
      true,
      [this.accounts[0]]
    );
    // this.uniswapv3.balanceETH = await this.web3.eth.getBalance(
    //   this.accounts[0]
    // );
    return true;
  },
  async initializeUniswap() {
    this.uniFactory = await new this.web3.eth.Contract(
      uniswapV2FactoryABI,
      this.addresses[this.net.name]["UniswapV2Factory"]
    );
    let priceInETH = await this.getUniswapPrice("GAMMA");
    let priceOfETH = await this.getUniswapPrice("DAI");
    this.visrPrice = priceInETH * priceOfETH;
  },
  async getUniswapPrice(asset) {
    let pairAddress = await this.web3Call(
      this.uniFactory.methods.getPair,
      true,
      [
        this.addresses[this.net.name][asset],
        this.addresses[this.net.name]["WETH"]
      ]
    );
    this.uniVISRWETH = await new this.web3.eth.Contract(
      uniswapV2PairABI,
      pairAddress
    );
    let reserves = await this.web3Call(this.uniVISRWETH.methods.getReserves);
    let price = reserves["_reserve0"] / reserves["_reserve1"];
    return price;
  },
  async initializeRedeem() {
    this.redeem = await new this.web3.eth.Contract(
      this.artifacts["Redeem"].abi,
      this.artifacts["Redeem"].address
    );
  },
  async initializeRewardsHypervisor() {
    if (this.addresses[this.net.name]["RewardsHypervisor"]) {
      this.rewards = await new this.web3.eth.Contract(
        rewardsABI,
        this.addresses[this.net.name]["RewardsHypervisor"]
      );

      if (this.net.name === "mainnet") {
        this.tokens["GAMMA"] = await new this.web3.eth.Contract(
          gammaABI,
          this.addresses[this.net.name]["GAMMA"]
        );
        this.tokens["xGAMMA"] = await new this.web3.eth.Contract(
          xGammaABI,
          this.addresses[this.net.name]["xGAMMA"]
        );
  
        this.rewardsBase = await this.web3Call(
          this.tokens["GAMMA"].methods.balanceOf,
          true,
          [this.rewards._address]
        );
        this.rewardsSupply = await this.web3Call(
          this.tokens["xGAMMA"].methods.totalSupply
        );
        this.rewardsRatio = this.BN(this.rewardsBase).div(
          this.BN(this.rewardsSupply)
        );
      }
    }
  },
  async initializeRewards() {
    for (let i = 0; i < this.tableData.length; i++) {
      await this.initializeAludel(this.tableData[i][0]);
      await this.initializeStakingToken(this.tableData[i][0]);
    }
  },
  async initializeAludel(stakingToken) {
    //choose staking token rewards
    if (!this.aludels[stakingToken]) {
      this.aludels[stakingToken] = await new this.web3.eth.Contract(
        this.artifacts["Aludel"].abi,
        this.addresses[this.net.name][stakingToken + "-Aludel"]
      );
    }
  },
  async initializeStakingToken(stakingToken) {
    //choose staking token
    if (!this.tokens[stakingToken]) {
      this.tokens[stakingToken] = await new this.web3.eth.Contract(
        this.artifacts["StakingToken"].abi,
        this.addresses[this.net.name][stakingToken]
      );
    }
  },
  async initializeFactory() {
    this.crucibleFactory = await new this.web3.eth.Contract(
      this.artifacts["CrucibleFactory"].abi,
      this.artifacts["CrucibleFactory"].address
    );
  },
  async initializeTransmuter() {
    this.transmuter = await new this.web3.eth.Contract(
      this.artifacts["Transmuter"].abi,
      this.artifacts["Transmuter"].address
    );
  },
  updateTable(aludel, column, value) {
    let row;
    for (row = 0; row < this.tableData.length; row++) {
      if (this.tableData[row][0] == aludel) break;
    }
    if (row == this.tableData.length) return;
    switch (column) {
      case "deposit":
        this.tableData[row][1] = this.accounts[0] ? value : "-";
        break;
      case "reward":
        if (!this.accounts[0]){
          this.tableData[row][3] = "-";
          break;
        }
        if (aludel == "VISR-ETH") {
          this.tableData[row][3] = value;
        } else if (aludel == "xGAMMA") {
          value = this.BN(value)
            .multipliedBy(this.BN(this.visorStatsData.visrPrice ? this.visorStatsData.visrPrice : 0.5))
            .toFixed(2);
          this.tableData[row][3] = "$" + value;
        } else if (this.isLP(aludel))  this.tableData[row][3] = value != "$NaN" ? value : "$0.00";
        else this.tableData[row][3] = "-";
        break;
      case "apy":
        if (
          aludel == "VISR-ETH" ||
          this.isSpecialPair(this.translateWETH(aludel))
        ) {
          this.tableData[row][4] = "-";
        } else {
          if (aludel == "GAMMA") {
            this.tableData[row][4] = "-";
            // this.tableData[row][4] = this.apy_percent + "%";
          } else if (aludel == "xGAMMA") {
            this.tableData[row][4] = this.apy_percent + "%";
            this.tableData[row][4] = "-";
          } else if (this.isLP(aludel)) {
            // this.tableData[row][4] = "-";
            this.tableData[row][4] =
              this.uniswapv3.hypes[this.translateWETH(aludel, false)].apy + "%";
          } else {
            this.tableData[row][4] = "-";
          }
        }
        break;
    }
  },
  async checkAddress() {
    let vaults = await this.web3Call(
      this.crucibleFactory.methods.vaultCount,
      true,
      [this.accounts[0]]
    );
    return vaults > 0;
  },
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  async getRealTxHash(txHash) {
    const response = await fetch(
      `https://safe-transaction.gnosis.io/api/v1/multisig-transactions/${txHash}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data) {
        if (data.transactionHash) return data.transactionHash;
        else {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            await this.sleep(10000);
            const response2 = await fetch(
              `https://safe-transaction.gnosis.io/api/v1/multisig-transactions/${txHash}`
            );
            const data2 = await response2.json();
            if (data2.transactionHash) {
              return data2.transactionHash;
            }
          }
        }
      } else return txHash;
    } else return txHash;
  },
  pollTx(txHash, name, success, fail) {
    let realTx = txHash;
    setTimeout(async () => {
      const walletType = window.localStorage.getItem("visorSelectedWallet");

      if (walletType == "WalletConnect")
        realTx = await this.getRealTxHash(txHash);

      Object.assign(this.pollTxInstance, {
        name,
        success,
        fail,
      });

      this.polls[name] = setInterval(() => {
        this.web3.eth.getTransaction(realTx, (err, res) => {
          if (err) {
            clearInterval(this.polls[name]);
            fail(err);
          }
          if (res && res.blockNumber) {
            clearInterval(this.polls[name]);
            success(res.blockNumber);
          }
        });
      }, 3000);
    }, 500);
  },
  async scanBlocks(fromBlock, toBlock) {
    let events = await this.crucibleFactory.getPastEvents("NewUserInstance", {
      filter: {},
      fromBlock: fromBlock,
      toBlock: toBlock
    });
    let nfts = [];
    for (let i = 0; i < events.length; i++) {
      if (!events[i].returnValues._sender) continue;
      if (events[i].returnValues._sender == this.accounts[0]) {
        nfts.push(events[i].returnValues._instance);
      }
    }
    return nfts;
  },

  async signPermissionUnlock(
    vault, // crucible
    owner, // ethers signer,
    delegateAddress, //aludel address
    tokenAddress, // this.StakingToken.address
    amount
  ) {
    const domain = {
      name: "UniversalVault",
      version: "1.0.0",
      chainId: this.net.number,
      verifyingContract: this.crucible._address
    };

    const types = {
      Unlock: [
        { name: "delegate", type: "address" },
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    let nonce = await this.crucible.methods.getNonce().call();

    const value = {
      delegate: delegateAddress,
      token: tokenAddress,
      amount: amount,
      nonce: nonce
    };

    const signedPermission = await owner._signTypedData(domain, types, value);

    return signedPermission;
  },

  async signPermissionLock(
    vault, // crucible
    owner, // ethers signer,
    delegateAddress, //aludel address
    tokenAddress, // this.StakingToken.address
    amount
  ) {
    const domain = {
      name: "UniversalVault",
      version: "1.0.0",
      chainId: this.net.number,
      verifyingContract: this.crucible._address
    };

    const types = {
      Lock: [
        { name: "delegate", type: "address" },
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    let nonce = await this.crucible.methods.getNonce().call();

    const value = {
      delegate: delegateAddress,
      token: tokenAddress,
      amount: amount,
      nonce: nonce
    };

    const signedPermission = await owner._signTypedData(domain, types, value);

    return signedPermission;
  },
  // async fetchSummary() {
  //   let resp = await fetch(this.net.api1 + "/dashboard")
  //     .then(response => response.json())
  //     .catch(() => {
  //       return fetch(this.net.api2 + "/dashboard")
  //         .then(response => response.json())
  //         .catch(() => ({ feeStatsStakingApy: ".22" }));
  //     });
  //   return resp;
  // },

  // Status function for whether a hypervisors cap has been reached
  async isCapReached(pairName) {
    let curSupply = await this.web3Call(
      this.uniswapv3.hypes[pairName]["hype"].methods.totalSupply
    );
    let maxTotalSupply = await this.web3Call(
      this.uniswapv3.hypes[pairName]["hype"].methods.maxTotalSupply
    );

    if (maxTotalSupply == 0) return false;

    if (this.BN(curSupply).lt(this.BN(maxTotalSupply))) return false;

    return true;
  },

  /**
   * Onboard Initialize function
   */
  onBoardInitialize() {
    if (this.onboard) {
      this.onboard.walletReset();
      this.onboard.config({
        networkId: this.net.number ? this.net.number : 1,
      });
      return;
    }
    let onboard = Onboard({
      walletSelect: {
        heading: "Account",
        description: "",
        explanation:
          "New to Ethereum?  <a href='https://ethereum.org/en/wallets/' target='_blank'>Learn more about wallets</a>",
        wallets: [
          { walletName: "metamask" },
          { walletName: "walletConnect", infuraKey: process.env.VUE_APP_INFURA_KEY },

          { walletName: "coinbase" },
          {
            walletName: "walletLink",
            rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/HJlgjSQjTKjfKKiPIeQmN2jUE0x2iXCU`,
            appName: "dev"
          }
        ]
      },
      darkMode: true,
      dappId: process.env.VUE_APP_ONBOARD_KEY,
      networkId: this.net.number ? this.net.number : 1,
      networkName: this.net.networkName ? this.net.networkName : "mainnet",
      subscriptions: {
        wallet: async (wallet) => {
          let web3 = new Web3(wallet.provider);
          // web3.eth.getAccounts().then();
          Object.assign(this.web3, web3);
          Object.assign(this.web4, web3);
          const walletAvailable = await onboard.walletCheck();
          if (walletAvailable) {
            this.ethersProvider = new ethers.providers.Web3Provider(
              wallet.provider
            );
            this.signer = this.ethersProvider.getSigner();

            window.localStorage.setItem("visorSelectedWallet", wallet.name);
          }
        },
      },
    });
    this.onboard = onboard;

    this.notify = Notify({
      dappId: process.env.VUE_APP_ONBOARD_KEY,
      networkId: this.net.number ? this.net.number : 1,
      txApproveReminderTimeout: 0,
      txStallPendingTimeout: 0,
      txStallConfirmedTimeout: 0,
      // apiUrl,
      onerror: error => console.log(`Notify error: ${error.message}`)
    });
  },

  /**
   * Change network function on core with new net
   * @returns change network status
   */
  async changeNetwork() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + net.number.toString(16) }]
        });
        Object.assign(this.net, net);
        return true;
      } catch (error) {
        Object.assign(net, this.net);
        return false;
      }
    }
  },

  /**
   * Get the greatest common factor in js
   */
  gcdFunc(a, b) {
    if (!b) return a;
    return this.gcdFunc(b, a % b);
  },
  /**
   * Get the ratio of hypervisor for each pair
   */
  getRatio(pair) {
    if (!this.uniswapv3.hypes[pair]) return;
    let total0 = Math.round(
      this.BN(this.uniswapv3.hypes[pair].totals.total0).div(
        Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0))
      ) * 100
    );
    let total1 = Math.round(
      this.BN(this.uniswapv3.hypes[pair].totals.total1).div(
        Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1))
      ) * 100
    );
    // let gcd = this.gcdFunc(totals.total0, totals.total1);
    // let total0 = totals.total0.dividedBy(gcd);
    // let total1 = totals.total1.dividedBy(gcd);
    // console.log(gcd, total0, total1);
    return total0.toString() + " : " + total1.toString();
  },

  /**
   * minOut : compute current user's pair tokens amount
   * @param { hype pairs } pair 
   * @param { Boolean variable which shown web3 call is enable or not } web3Call 
   * @returns 
   */
  
   async minOut(pair, slippage = 10) {
    try {
    let netNum = this.net.number;
    let hype = this.uniswapv3.hypes[pair].hype;
    let fee = this.uniswapv3.hypes[pair].fee;

    let poolContract = this.uniswapv3.hypes[pair].pool;
    console.log(poolContract);

    let slot0 = await poolContract.methods.slot0().call();
    let liq = await poolContract.methods.liquidity().call();

    let token0Contract = this.uniswapv3.hypes[pair].token0;
    let token1Contract = this.uniswapv3.hypes[pair].token1;

    let symbol0 = await token0Contract.methods.symbol().call();
    let symbol1 = await token1Contract.methods.symbol().call();
    let tokenName0 = await token0Contract.methods.name().call();
    let tokenName1 = await token1Contract.methods.name().call();

    let token0 = new sdkCore.Token(netNum, token0Contract._address, this.uniswapv3.hypes[pair].decimals0, symbol0, tokenName0);
    let token1 = new sdkCore.Token(netNum, token1Contract._address, this.uniswapv3.hypes[pair].decimals1, symbol1, tokenName1);

    let pool = new sdk.Pool(token0, token1, fee, slot0.sqrtPriceX96, liq, parseInt(slot0.tick));

    let baseContract = await hype.methods.getBasePosition().call();

    let baseLower = await hype.methods.baseLower().call();
    let baseUpper = await hype.methods.baseUpper().call();

    let base = new sdk.Position({
      pool: pool,
      liquidity: baseContract.liquidity,
      tickLower: parseInt(baseLower),
      tickUpper: parseInt(baseUpper)
    });

    let slippagePercent = new sdkCore.Percent(slippage, 100);
    let baseAmounts = base.burnAmountsWithSlippage(slippagePercent);

    let limitContract = await hype.methods.getLimitPosition().call();
    let limitLower = await hype.methods.limitLower().call();
    let limitUpper = await hype.methods.limitUpper().call();

    let limit = new sdk.Position({
      pool: pool,
      liquidity: limitContract.liquidity,
      tickLower: parseInt(limitLower),
      tickUpper: parseInt(limitUpper)
    });

    slippagePercent = new sdkCore.Percent(slippage, 100);
    let limitAmounts = limit.burnAmountsWithSlippage(slippagePercent);

    return [
      this.eToNumber(baseAmounts.amount0.toString()),
      this.eToNumber(baseAmounts.amount1.toString()),
      this.eToNumber(limitAmounts.amount0.toString()),
      this.eToNumber(limitAmounts.amount1.toString())
    ];
   }
   catch {
    return ['0','0','0','0'];
   }
  },

  /**
   * minOut : Apply the user's percent of shares
   * @param { baseAmount0 baseAmount1,  limitAmount0, limitAmount1} pair 
   * @returns 
   */

   async userMinOut(units, pair, minOut) {

    let perc = this.BN(units).div(this.BN(this.uniswapv3.hypes[pair]["totalSupply"]));

    return [
			this.eToNumber((this.BN(perc) * this.BN(minOut[0])).toFixed(0)),
      this.eToNumber((this.BN(perc) * this.BN(minOut[1])).toFixed(0)),
      this.eToNumber((this.BN(perc) * this.BN(minOut[2])).toFixed(0)),
      this.eToNumber((this.BN(perc) * this.BN(minOut[3])).toFixed(0)),
    ]
  }, 

  /**
   * calculateAmounts : compute current user's pair tokens amount
   * @param { hype pairs } pair 
   * @param { Boolean variable which shown web3 call is enable or not } web3Call 
   * @returns 
   */
  
  async calculateAmounts(pair, web3Call = true) {
    if (web3Call) {
      this.uniswapv3.hypes[pair]["shares"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.balanceOf,
        true,
        [this.version == "main" ? this.accounts[0] : this.crucible._address]
      );
      this.uniswapv3.hypes[pair]["totalSupply"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.totalSupply
      );
      this.uniswapv3.hypes[pair]["baseTotals"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.getBasePosition
      );
      this.uniswapv3.hypes[pair]["limitTotals"] = await this.web3Call(
        this.uniswapv3.hypes[pair]["hype"].methods.getLimitPosition
      );
    }
    let totalSupply = this.uniswapv3.hypes[pair]["totalSupply"];

    return {
      baseToken0: this.BN(this.uniswapv3.hypes[pair].baseTotals.amount0)
      // .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0)))
      .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
      .div(totalSupply).toString().split('.')[0],
      baseToken1: this.BN(this.uniswapv3.hypes[pair].baseTotals.amount1)
      // .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1)))
      .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
      .div(totalSupply).toString().split('.')[0],

      limitToken0: this.BN(this.uniswapv3.hypes[pair].limitTotals.amount0)
      // .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals0)))
      .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
      .div(totalSupply).toString().split('.')[0],
      limitToken1: this.BN(this.uniswapv3.hypes[pair].limitTotals.amount1)
      // .div(Math.pow(10, this.BN(this.uniswapv3.hypes[pair].decimals1)))
      .multipliedBy(this.BN(this.uniswapv3.hypes[pair].shares))
      .div(totalSupply).toString().split('.')[0],
    }
  },

  /**
   * calculateMinAmounts : compute percentage of user amount0, amount1
   * @param {*} pair 
   * @param {*} amount0 
   * @param {*} amount1 
   */

  async calculateMinAmounts(perc, baseAmount0, baseAmount1, limitAmount0, limitAmount1) {
    return {
      baseAmount0: (this.BN(baseAmount0).minus(this.BN(baseAmount0).div(this.BN(100)).times(this.BN(perc)))).toFixed(0),
      baseAmount1: (this.BN(baseAmount1).minus(this.BN(baseAmount1).div(this.BN(100)).times(this.BN(perc)))).toFixed(0),
      limitAmount0: (this.BN(limitAmount0).minus(this.BN(limitAmount0).div(this.BN(100)).times(this.BN(perc)))).toFixed(0),
      limitAmount1: (this.BN(limitAmount1).minus(this.BN(limitAmount1).div(this.BN(100)).times(this.BN(perc)))).toFixed(0),
    }
  },


  /**
   * ExpandeData func for dashboard
   */
  // async fetchVisorStatsData() {
  //   const response = await fetch(
  //     "https://visordata-o9v9w.ondigitalocean.app/dashboard"
  //   );
  //   this.visorStatsData = await response.json();
  // },

  formatVisorStats(stats) {
    return {
      ...stats,
      stakedUsdAmount: this.formatStat(stats.stakedUsdAmount),
      stakedAmount: this.formatStat(stats.stakedAmount, false, ""),
      feeStatsStakingApy: this.formatStat(stats.feeStatsStakingApy, true),
      feeStatsStakingDailyYield: this.formatStat(
        stats.feeStatsStakingDailyYield,
        true
      ),
      // uniswapFeesBasedApr: `${stats.uniswapFeesBasedApr * 100}%`,
      feeStatsFeeAccural: this.formatStat(stats.feeStatsFeeAccural),
      feeStatsAmountVisr: this.formatStat(stats.feeStatsAmountVisr, false, ""),
      feeCumulativeFeeUsd: this.formatStat(stats.feeCumulativeFeeUsd),
      feeCumulativeFeeUsdAnnual: this.formatStat(
        stats.feeCumulativeFeeUsdAnnual
      ),
      feeCumulativeFeeDistributed: this.formatStat(
        stats.feeCumulativeFeeDistributed,
        false,
        ""
      ),
      feeCumulativeFeeDistributedAnnual: this.formatStat(
        stats.feeCumulativeFeeDistributedAnnual,
        false,
        ""
      ),
      uniswapPairTotalValueLocked: this.formatStat(
        stats.uniswapPairTotalValueLocked,
        false
      ),
      uniswapFeesGenerated: this.formatStat(stats.uniswapFeesGenerated)
    };
  },
  formatStat(value, isPercent = false, currency = "$") {
    let type = isPercent ? PERCENT : -1;
    if (!isPercent) {
      if (value > 999999) {
        type = MILLION;
      } else if (value > 999) {
        type = THOUSAND;
      }
    }

    switch (type) {
      case MILLION:
        return `${currency}${(parseFloat(value) / 1000000).toFixed(2)}M`;
      case THOUSAND:
        return `${currency}${(parseFloat(value) / 1000).toFixed(2)}K`;
      case PERCENT:
        return `${Math.round(parseFloat(value) * 100 * 100) / 100}%`;
      default:
        return `${currency}${parseFloat(value).toFixed(2)}`;
    }
  },
  async getExpandedData(dataTable) {
    let result = {};
    if (!dataTable) return result;
    if (!this.visorStatsData) return result
    const visorStats = this.formatVisorStats(this.visorStatsData);

    dataTable.data.forEach(async row => {
      const translatedWETH = this.translateWETH(row[0], false);
      const hype = this.uniswapv3.hypes[translatedWETH];

      if (row[0] === "xGAMMA") {
        result[row[0]] = {
          ...visorStats,
          visrPervVisr: Math.round(visorStats.visrPerVvisr * 100000) / 100000,
        };
      } else if (!hype) {
        result[row[0]] = null;
      } else {
        let curSupply = parseFloat(hype.totalSupply);
        //await hype.hype.methods.totalSupply().call()
        let maxTotalSupply = parseFloat(hype.maxTotalSupply);
        //await hype.hype.methods.maxTotalSupply().call()
        const pair = this.pairs[this.net.name][translatedWETH];

        result[row[0]] = {
          tvl: parseFloat(hype.tvl || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
          label0: hype.label0.split(" ")[1]
            ? hype.label0.split(" ")[1]
            : hype.label0,
          label1: hype.label1.split(" ")[1]
            ? hype.label1.split(" ")[1]
            : hype.label1,
          balance0: Math.round(hype.userAmount0 * 100) || 0,
          balance1: Math.round(hype.userAmount1 * 100) || 0,
          perc:
            (maxTotalSupply !== 0 &&
              ((curSupply / maxTotalSupply) * 100).toFixed(2)) ||
            0,
          numberOfShares: this.BN(hype.shares || 0) || 0,
          fee: (pair && (parseFloat(pair.fee) / 10000).toFixed(2)) || 0,
          deposit0Max: pair && pair.deposit0Max.toFixed(3),
          deposit1Max: pair && pair.deposit1Max.toFixed(3)
        };
      }
    });
    return result;
  },

  /**
   * amountFormatter func
   */
  amountFormatter(amount, dec) {
    let hundreds = this.web3.utils.toBN(dec).sub(this.web3.utils.toBN("2"));

    let amountFormatted = this.web3.utils
      .toBN(amount)
      .div(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(dec)));
    let amountFormattedDex = this.web3.utils
      .toBN(amount)
      .div(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(hundreds)))
      .toNumber()
      .toString()
      .slice(-2);

    let formatedString =
      amountFormatted.toString() + "." + amountFormattedDex.toString();

    if (formatedString == "0.0") formatedString = "0.00";
    return formatedString;
  },

  /**
   * Current vault detail from endpoint
   */
  async updateEndpoint(vault = true) {
    // if (!this.net.api1) return;
    // if (this.net.number !== 1) return;

    if (vault && this.net.number == 1) {
      this.shareOfSupplyNonUser = await fetch(
        this.net.api1 + `/vault/${this.crucible._address}`
      )
        .then(response => response.json())
        .catch(async () => {
          return fetch(this.net.api2 + `/vault/${this.crucible._address}`)
            .then(response => response.json())
            .catch(() => {
              return false;
            });
        });
    }

    // if (!this.nonUser) {
    this.nonUser = await fetch(this.net.api1 + "/hypervisors/allData")
      .then(response => response.json())
      .catch(() => {
        return fetch(this.net.api2 + "/hypervisors/allData")
          .then(response => response.json())
          .catch(() => false);
      });

    // }
    // if (!this.latestApys) {
    this.latestApys = await fetch(this.net.api1 + "/hypervisors/returns")
      .then(response => response.json())
      .catch(() => {
        return fetch(this.net.api2 + "/hypervisors/returns").then(response =>
          response.json()
        ).catch(() => false);;
      });
    // }
  },

  /**
   * Web3 continious try & catch call
   * @param {Contract func} contractFunc
   * @param {Read or Write web3 calls } read
   * @param {Parmeters for that func} params
   * @returns
   */
  async web3Call(contractFunc, read = true, params = []) {
    let runtime = 1;
    let result;
    while (runtime && runtime < 10)
      try {
        if (read) result = await contractFunc(...params).call();
        // console.log(runtime);
        runtime = 0;
      } catch (err) {
        runtime++;
      }
    return result;
  },
  /**
   * Directly Web3 continious try & catch call
   * @param {Contract func} contractFunc
   * @param {Read or Write web3 calls } read
   * @param {Parmeters for that func} params
   * @returns
   */
  async directWeb3Call(func, read = true, params = []) {
    let runtime = 1;
    let result;
    while (runtime && runtime < 10)
      try {
        if (read) result = await func(...params);
        // console.log(runtime);
        runtime = 0;
      } catch (err) {
        runtime++;
      }
    return result;
  },

  /**
   * Get Gas Price Endpoint json data
   */
  gasPricePromise() {
    // return {};
    return new Promise((resolve, reject) => {
      https
        .get(
          "https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=9b962ccb22d6fea1f8de5dec4f716558d361644662f0be84f65692a192e4",
          resp => {
            let data = "";

            // A chunk of data has been received.
            resp.on("data", chunk => {
              data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on("end", () => {
              const fast = JSON.parse(data).fast;
              resolve(Math.round(1.1 * fast * 100000000));
            });
          }
        )
        .on("error", err => {
          reject(null);
        });
    });
  },

  async gasPrice() {
    // let gasPrice = await fetch("https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=9b962ccb22d6fea1f8de5dec4f716558d361644662f0be84f65692a192e4")
    //   .then(response => {
    //     let res = resposne.json();
    //     console.log(res);
    //     return Math.round(1.1 * res.fast * 100000000);
    //   })
    //   .catch(() => {
    //     console.log("here is dummy");
    //     return null;
    //   });
    if (this.net.name == 'polygon') return "50000000000";
    return 0;
    return null//gasPrice;
  }
};

Object.assign(core.net, net);

const web3Url = "https://" + net.name + ".infura.io/v3/" + process.env.VUE_APP_INFURA_KEY;
// const web3Url = 'https://bsc-dataseed1.defibit.io';//'https://'+net.name+'.infura.io/v3/'+process.env.VUE_APP_INFURA_KEY;
// core.web4 = new Web3(new Web3.providers.HttpProvider(web3Url));
core.web4 = new Web3(Web3.givenProvider || web3Url);

let pairs = [];

if (net.name !== undefined) {
  core.crucibleQuery = new core.web4.eth.Contract(
    core.artifacts["CrucibleFactory"].abi,
    core.artifacts["CrucibleFactory"].address
  );
  
  const pairList = core.pairs[core.net.name];
  pairs = Object.keys(pairList)
    .map((pair) => {
      if(pairList[pair].version == 'live'){
        return [
          core.translateWETH(pair, true),
          "0.00",
          pairList[pair].strategy,
          "0.00",
          "-",
          pairList[pair].status,
        ]
      } else {
        return null;
      }
    });
  pairs = pairs.filter(value => value != null).reverse();
}

const sample = [
  ["xGAMMA", "0.00", "Gamma 1.0", "-", "-", "Active"],
  ...pairs
];

Object.assign(core.tableData, sample);
core.onBoardInitialize();

Vue.use(CarbonComponentsVue);
Vue.use(CarbonIconsVue, {
  components: {
    TrashCan16,
    Download16,
    Save16
  }
});

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.config.productionTip = false;

new Vue({
  router: router,
  store,
  data: {
    core: core,
    net: net
  },
  render: (h) => h(App),
}).$mount("#app");
