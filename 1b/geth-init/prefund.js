const from = eth.accounts[0];
const contractDeployer = "0x3dC104B90b963a1d4D004517B2D6d530952Db75c";
eth.sendTransaction({
  from: from,
  to: contractDeployer,
  value: web3.toWei(100, "ether"),
});
