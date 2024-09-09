"use client";

import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/single-factor-auth";
import { useEffect, useState } from "react";
import TelegramLoginButton, { TelegramUser } from "telegram-login-button";
import { verifyAndIssueJwt } from "../actions/verify";
import Rating from "./Rating";
import { ethers, JsonRpcSigner } from "ethers";

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!; // get from https://dashboard.web3auth.io

const verifier = "ps-app";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882", // Please use 0x1 for Mainnet
  rpcTarget:
    "https://polygon-amoy.infura.io/v3/ab58dabba09344328d65ade91dc9707f",
  displayName: "Amoy",
  blockExplorer: "https://amoy.polygonscan.com/",
  ticker: "MATIC",
  tickerName: "Polygon",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId, // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

function Home() {
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

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
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
      <header className="text-gray-400 bg-gray-900 body-font fixed w-screen z-50 border-b-2 border-b-gray-500">
        <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center justify-between">
          <a className="flex title-font font-medium items-center text-white mb-4 md:mb-0 cursor-pointer">
            <img
              className="w-56 h-10"
              alt="logo"
              src="/img/logo-no-background2.png"
            />
          </a>

          <button onClick={logout} className="card flex text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg">
            Log Out ➜
          </button>
          
        </div>
      </header>
        <div>{signer && <Rating wallet={signer} />}</div>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <section className="text-gray-400 bg-gray-900 body-font flex items-center">
        <div className="container mx-auto flex px-5 py-16 lg:py-24 flex-wrap-reverse justify-center items-center h-screen">
          <div className="lg:flex-grow md:w-1/2 flex flex-col md:items-start md:text-left items-center text-center">
            <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-white">
              Decentralized Reputation at Your Fingertips
            </h1>
            <p className="mb-8 leading-relaxed">
              Scan and rate users instantly via QR codes. Instantly view the
              average ratings and total ratings. All ratings are publicly
              verifiable, ensuring transparency.
            </p>
            <div className="flex justify-center">
              <TelegramLoginButton
                botName="PulseScoreBot"
                dataOnauth={async (user: TelegramUser) => {
                  const verify = await verifyAndIssueJwt(user);
                  console.log(verify);
                  if (!verify) throw new Error("No token");
                  login(verify, user.id.toString());
                }}
              />
            </div>
          </div>
          <div className="md:w-96 w-60">
            <img
              className="object-cover object-center rounded"
              alt="logo"
              src="/img/logo-no-background.png"
            />
          </div>
        </div>
      </section>
    </>
  );

  return (
    <>
      <div>{loggedIn ? loggedInView : unloggedInView}</div>
    </>
  );
}

export default Home;
