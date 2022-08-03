const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;
const main = async () => {
  console.log("🚀 Starting test...");
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Myepicproject;
  // Create an account keypair for our program to use.
  const baseAccount = anchor.web3.Keypair.generate();

  // Call start_stuff_off, pass it the params it needs!
  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  // Fetch data from the account.
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("📝 Your transaction signature", tx);
  console.log("👀 GIF Count", account.totalGifs.toString());

  // You'll need to now pass a GIF link to the function! You'll also need to pass in the user submitting the GIF!
  await program.rpc.addGif(
    "https://c.tenor.com/YrvBNH8LfwgAAAAC/eren-mcdonalds.gif",
    {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    }
  );

  // Call the account.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("👀 GIF Count", account.totalGifs.toString());

  // Access gif_list on the account!
  console.log("👀 GIF List", account.gifs);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
