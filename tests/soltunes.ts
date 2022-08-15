import * as anchor from '@project-serum/anchor'
import { Program, Wallet } from '@project-serum/anchor'
import { MusicNft } from '../target/types/music_nft'
import { AdvNft } from '../target/types/adv_nft'
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createInitializeMintInstruction, MINT_SIZE } from '@solana/spl-token' // IGNORE THESE ERRORS IF ANY
const { SystemProgram } = anchor.web3

describe('Music and Adv NFT', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as Wallet;
  anchor.setProvider(provider);
  const musicProgram = anchor.workspace.MusicNft as Program<MusicNft>
  const advProgram = anchor.workspace.AdvNft as Program<AdvNft>
  it("Can mint", async () => {
    // Add your test here.

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );


    if (!musicProgram) {
      throw new Error("Cannot get music program")
    }

    const musicLamPorts: number =
      await musicProgram.provider.connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );
    const advLamPorts: number =
      await advProgram.provider.connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );
    const getMetadata = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    const getMasterEdition = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };


    const musicMintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const advMintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const MusicNftTokenAccount = await getAssociatedTokenAddress(
      musicMintKey.publicKey,
      wallet.publicKey
    );

    const AdvNftTokenAccount = await getAssociatedTokenAddress(
      advMintKey.publicKey,
      wallet.publicKey
    );

    console.log("NFT Account: ", MusicNftTokenAccount.toBase58());

    const mint_music_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: musicMintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports: musicLamPorts,
      }),
      createInitializeMintInstruction(
        musicMintKey.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        MusicNftTokenAccount,
        wallet.publicKey,
        musicMintKey.publicKey
      ),
    )
    const mint_adv_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: advMintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports: advLamPorts,
      }),
      createInitializeMintInstruction(
        advMintKey.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        AdvNftTokenAccount,
        wallet.publicKey,
        advMintKey.publicKey
      )
    )
    const musicRes = await musicProgram.provider.sendAndConfirm(mint_music_tx, [musicMintKey]);
    console.log(
      await musicProgram.provider.connection.getParsedAccountInfo(musicMintKey.publicKey)
    );

    const advRes = await advProgram.provider.sendAndConfirm(mint_adv_tx, [advMintKey]);
    console.log(
      await advProgram.provider.connection.getParsedAccountInfo(advMintKey.publicKey)
    );


    console.log("Account: ", musicRes);
    console.log("Mint key: ", musicMintKey.publicKey.toString());
    console.log("User: ", wallet.publicKey.toString());

    const musicMetadataAddress = await getMetadata(musicMintKey.publicKey);
    const advMetadataAddress = await getMetadata(advMintKey.publicKey);
    const musicMasterEdition = await getMasterEdition(musicMintKey.publicKey);
    const advMasterEdition = await getMasterEdition(advMintKey.publicKey);

    console.log("Metadata address: ", musicMetadataAddress.toBase58());
    console.log("MasterEdition: ", musicMasterEdition.toBase58());
    let tx = await musicProgram.methods.mintMusicNft(
      musicMintKey.publicKey,
      "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
      "Music A1",
    )
      .accounts({
        mintAuthority: wallet.publicKey,
        mint: musicMintKey.publicKey,
        tokenAccount: MusicNftTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadata: musicMetadataAddress,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        masterEdition: musicMasterEdition,
      },
      ).rpc();

    console.log("Your transaction signature", tx);

    //TODO add test to check if mint authority is not signer and/or not owner of that metadata account
    tx = await advProgram.methods.mintAdvNft(
      advMintKey.publicKey,
      "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
      "Adv for Music A1"
    ).accounts({
      mintAuthority: wallet.publicKey,
      mint: advMintKey.publicKey,
      tokenAccount: AdvNftTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadata: advMetadataAddress,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      masterEdition: advMasterEdition,
    }).rpc()

  })
})