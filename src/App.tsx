import React, { Component } from "react";
import ReactDOM from "react-dom";
import logo from './logo.svg';
import './App.css';
import { DirectSecp256k1HdWallet, Registry, GeneratedType } from "@cosmjs/proto-signing";
import { createPagination, createRpc, QueryClient } from "@cosmjs/stargate";
import { defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import { makeCosmoshubPath, Secp256k1HdWallet, SigningCosmosClient } from "@cosmjs/launchpad";
import { MsgRegisterAccount } from "./codec/intertx/tx";
import { QueryClientImpl } from "./codec/intertx/query";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
const myTypes: ReadonlyArray<[string, GeneratedType]> = [["/intertx.MsgRegisterAccount", MsgRegisterAccount]]

const myRegistry = new Registry([
  ...defaultRegistryTypes,
  ...myTypes,
]);

const mnemonic = // Replace with your own mnemonic
  "alley afraid soup fall idea toss can goose become valve initial strong forward bright dish figure check leopard decide warfare hub unusual join cart";

const DEFAULT_ENDPOINT = "localhost:16657"
const COSM_DEV_ADDRESS_1 = "cosmos1mjk79fjjgpplak5wq838w0yd982gzkyfrk07am";


async function getClientforWalletMnemonic() {
  // TODO: Remove after documenting the difference between approaches
  // const signer = await DirectSecp256k1HdWallet.fromMnemonic(
  //   mnemonic,
  //   makeCosmoshubPath(0),
  //   "cosmos1", // Replace with your own Bech32 address prefix
  // );
  // const client = await SigningStargateClient.connectWithSigner(
  //   DEFAULT_ENDPOINT, // Replace with your own RPC endpoint
  //   signer,
  //   {
  //     registry: myRegistry,
  //   },
  // );
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
  const client = await SigningStargateClient.connectWithSigner(DEFAULT_ENDPOINT, wallet, {
    registry: myRegistry,
  });
  return client
}
async function makeBroadcastTx() {

  const client = await getClientforWalletMnemonic();
  const myAddress = COSM_DEV_ADDRESS_1;
  const message = {
    typeUrl: "/intertx.MsgRegisterAccount", // Same as above
    value: {
      owner: myAddress,
      sourcePort: "ibcaccount",
      sourceChannel: "channel-0",
      chainId: "test-1"
    },
  };
  const fee = {
    amount: [
      {
        denom: "stake", // Use the appropriate fee denom for your chain
        amount: "90000",
      },
    ],
    gas: "90000",
  };
  // Inside an async function...
  // This method uses the registry you provided
  const response = await client.signAndBroadcast(myAddress, [message], fee);
  console.log("Finished Request")
  console.log(response)
}

async function makeAddressQueryTx() {
  const queryAddress = COSM_DEV_ADDRESS_1
  // The Tendermint client knows how to talk to the Tendermint RPC endpoint
  const tendermintClient = await Tendermint34Client.connect(DEFAULT_ENDPOINT);

  // The generic Stargate query client knows how to use the Tendermint client to submit unverified ABCI queries
  const queryClient = new QueryClient(tendermintClient);

  // This helper function wraps the generic Stargate query client for use by the specific generated query client
  const rpcClient = createRpc(queryClient);

  // Here we instantiate a specific query client which will have the custom methods defined in the .proto file
  const queryService = new QueryClientImpl(rpcClient);

  // Now you can use this service to submit queries
  const encodedAddress = new TextEncoder().encode(queryAddress)
  console.log(encodedAddress)
  const queryResult = await queryService.IBCAccountFromAddress({
    address: encodedAddress,
    port: "ibcaccount",
    channel: "channel-0"
  });
  console.log("Finished Request")
  console.log(queryResult)

  // TODO: to be removed, approach #2 if above does not work 
  // const message = {
  //   typeUrl: "/intertx.Query", // Same as above
  //   value: {
  //     address: queryAddress,
  //     port: "ibcaccount",
  //     channel: "channel-0"
  //   },
  // };
  // const fee = {
  //   amount: [
  //     {
  //       denom: "stake", // Use the appropriate fee denom for your chain
  //       amount: "90000",
  //     },
  //   ],
  //   gas: "90000",
  // };
  // // This method uses the registry you provided
  // const response = await client.signAndBroadcast(queryAddress, [message], fee);
  // console.log("Finished Request")
  // console.log(response)
}

class App extends Component {

  render() {
    makeBroadcastTx()
    makeAddressQueryTx()
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
        </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
        </a>
        </header>
      </div>
    );
  }
}

export default App;
