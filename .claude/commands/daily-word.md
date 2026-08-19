# /daily-word

Rotate the daily word (admin only):

1. Read `data/projects/wordle.md` for the current word + rotation policy
2. Pick a 5-letter word (lowercase a-z, English dictionary)
3. `stellar contract invoke --id <contract> --source <admin> --network testnet -- set_word <word>`
4. Confirm `get_word` returns it
5. Record rotation in `data/logs/<date>-@ops.md`

Log to `data/logs/<date>-@ops.md`.