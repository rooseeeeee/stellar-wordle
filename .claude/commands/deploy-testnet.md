# /deploy-testnet

Deploy the wordle contract to Stellar Testnet:

1. Ensure `contracts/wordle/target/wasm32v1-none/release/wordle.wasm` is freshly built
2. `stellar contract deploy --wasm <wasm> --source <admin> --network testnet`
3. Init: `stellar contract invoke --id <contract> --source <admin> --network testnet -- __constructor <admin>`
4. Set a daily word: `stellar contract invoke --id <contract> --source <admin> --network testnet -- set_word <word>`
5. Record contract ID + WASM sha256 in `deployment.json`
6. Update `frontend/.env.local` with `NEXT_PUBLIC_CONTRACT_WORDLE`

Log to `data/logs/<date>-@ops.md`.