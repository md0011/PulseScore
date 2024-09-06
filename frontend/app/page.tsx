/* eslint-disable @typescript-eslint/no-use-before-define */

"use client";

import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { decodeToken, Web3Auth } from "@web3auth/single-factor-auth";
import { useEffect, useState } from "react";
import TelegramLoginButton, { TelegramUser } from "telegram-login-button";
import Web3 from "web3";
import { verifyAndIssueJwt } from "./actions/verify";
import Hello from "./component/Hello";
import { ethers, JsonRpcSigner } from "ethers";

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!; // get from https://dashboard.web3auth.io

const verifier = "ps-app";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // Please use 0x1 for Mainnet
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "Ethereum Mainnet",
  blockExplorer: "https://etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId, // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        setProvider(web3auth.provider);

        if (web3auth.status === ADAPTER_EVENTS.CONNECTED) {
          setLoggedIn(true);
          const ethersProvider = new ethers.BrowserProvider(web3auth.provider!);
          const signer = await ethersProvider.getSigner();
          setSigner(signer);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async (idToken: string, sub: string) => {
    if (!web3auth) {
      uiConsole("web3auth initialised yet");
      return;
    }

    const web3authProvider = await web3auth.connect({
      verifier,
      verifierId: sub,
      idToken,
    });

    if (web3authProvider) {
      setLoggedIn(true);
      setProvider(web3authProvider);
      const ethersProvider = new ethers.BrowserProvider(web3authProvider);
      const signer = await ethersProvider.getSigner();
      setSigner(signer);
    }
  };

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as any);

    // Get user's Ethereum public address
    const address = await web3.eth.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as any);

    // Get user's Ethereum public address
    const address = (await web3.eth.getAccounts())[0];

    // Get user's balance in ether
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address), // Balance is in wei
      "ether"
    );
    uiConsole(balance);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as any);

    // Get user's Ethereum public address
    const fromAddress = (await web3.eth.getAccounts())[0];

    const originalMessage = "YOUR_MESSAGE";

    // Sign the message
    const signedMessage = await web3.eth.personal.sign(
      originalMessage,
      fromAddress,
      "test password!" // configure your own password here.
    );
    uiConsole(signedMessage);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  }

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>{signer && <Hello wallet={signer} />}</div>
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <TelegramLoginButton
      botName="PulseScoreBot"
      dataOnauth={async (user: TelegramUser) => {
        const verify = await verifyAndIssueJwt(user);
        console.log(verify);
        if (!verify) throw new Error("No token");
        login(verify, user.id.toString());
      }}
    />
  );

  return (
    <>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    </>
  );
}

export default App;
