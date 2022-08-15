import * as anchor from '@project-serum/anchor'
import { Program, Wallet } from '@project-serum/anchor'
import { MusicNft } from '../target/types/music_nft'
import { AdvNft } from '../target/types/adv_nft'
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createInitializeMintInstruction, MINT_SIZE } from '@solana/spl-token' // IGNORE THESE ERRORS IF ANY
const { SystemProgram } = anchor.web3
import { Metaplex } from "@metaplex-foundation/js";

describe('metaplex-anchor-nft', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as Wallet;
  anchor.setProvider(provider);
  const musicProgram = anchor.workspace.Music as Program<MusicNft>
  const advProgram = anchor.workspace.Adv as Program<AdvNft>
  it("Is initialized!", async () => {
    // Add your test here.

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );


    if (musicProgram) {
      const lamports: number =
        await musicProgram.provider.connection.getMinimumBalanceForRentExemption(
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

      const advKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();

      const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
      const NftTokenAccount = await getAssociatedTokenAddress(
        mintKey.publicKey,
        wallet.publicKey
      );
      console.log("NFT Account: ", NftTokenAccount.toBase58());

      const mint_tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKey.publicKey,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
          lamports,
        }),
        createInitializeMintInstruction(
          mintKey.publicKey,
          0,
          wallet.publicKey,
          wallet.publicKey
        ),
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          NftTokenAccount,
          wallet.publicKey,
          mintKey.publicKey
        )
      )
      const res = await musicProgram.provider.sendAndConfirm(mint_tx, [mintKey]);
      console.log(
        await musicProgram.provider.connection.getParsedAccountInfo(mintKey.publicKey)
      );

      console.log("Account: ", res);
      console.log("Mint key: ", mintKey.publicKey.toString());
      console.log("User: ", wallet.publicKey.toString());

      const metadataAddress = await getMetadata(mintKey.publicKey);
      const masterEdition = await getMasterEdition(mintKey.publicKey);

      console.log("Metadata address: ", metadataAddress.toBase58());
      console.log("MasterEdition: ", masterEdition.toBase58());

      const tx = await musicProgram.methods.mintMusicNft(
        mintKey.publicKey,
        "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
        "NFT Title",
      )
        .accounts({
          mintAuthority: wallet.publicKey,
          mint: mintKey.publicKey,
          tokenAccount: NftTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadata: metadataAddress,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          masterEdition: masterEdition,
          mintAdv: advKey.publicKey,
          advProgram: advProgram.programId
        },
        )
        .rpc();
      console.log("Your transaction signature", tx);
    }

  })
})