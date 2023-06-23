import './App.css'
import "@biconomy-sdk-dev/web3-auth/dist/src/style.css"
import { useState, useEffect, useRef } from 'react'
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types";
import { ethers } from 'ethers'
import SmartAccount from "@biconomy/smart-account";

const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
const [interval, enableInterval] = useState(false)
const sdkRef = useRef<SocialLogin | null>(null)
const [loading, setLoading] = useState<boolean>(false)
const [provider, setProvider] = useState<any>(null)

useEffect(() => {
  let configureLogin:any
  if (interval) {
    configureLogin = setInterval(() => {
      if (!!sdkRef.current?.provider) {
        setupSmartAccount()
        clearInterval(configureLogin)
      }
    }, 1000)
  }
}, [interval])

async function login() {
  if (!sdkRef.current) {
    const socialLoginSDK = new SocialLogin()
    const signature1 = await socialLoginSDK.whitelistUrl('http://127.0.0.1:5173/')
    await socialLoginSDK.init({
      chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
      network: "testnet",
      whitelistUrls: {
        'http://127.0.0.1:5173/': signature1,
      }
    })
    sdkRef.current = socialLoginSDK
  }
  if (!sdkRef.current.provider) {
    sdkRef.current.showWallet()
    enableInterval(true)
  } else {
    setupSmartAccount()
  }
}

async function setupSmartAccount() {
  if (!sdkRef?.current?.provider) return
  sdkRef.current.hideWallet()
  setLoading(true)
  const web3Provider = new ethers.providers.Web3Provider(
    sdkRef.current.provider
  )
  setProvider(web3Provider)
  try {
    const smartAccount = new SmartAccount(web3Provider, {
      activeNetworkId: ChainId.POLYGON_MUMBAI,
      supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
      networkConfig: [
        {
          chainId: ChainId.POLYGON_MUMBAI,
          dappAPIKey: "your dapp api key from biconomy dashboard",
        },
      ],
    })
    await smartAccount.init()
    setSmartAccount(smartAccount)
    setLoading(false)
  } catch (err) {
    console.log('error setting up smart account... ', err)
  }
}

const logout = async () => {
  if (!sdkRef.current) {
    console.error('Web3Modal not initialized.')
    return
  }
  await sdkRef.current.logout()
  sdkRef.current.hideWallet()
  setSmartAccount(null)
  enableInterval(false)
}