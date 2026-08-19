#!/usr/bin/env bash
# Set campaign words on the deployed Wordle contract.
# This script calls set_word for each level's words sequentially.
# Usage: scripts/set-campaign-words.sh [source-identity]
set -euo pipefail

SOURCE="${1:-wordle-deployer}"
CONTRACT="CDXMKHTOJ74TPJS2XKL25V7R3MDQ5N766STNXH67SUSHK7DOLP2KMHSW"
NETWORK="testnet"

# Campaign words per level (auto-generated from word list)
declare -a WORDS=(
  # Level 1 - First Light (easy)
  "crane" "house" "plant"
  # Level 2 - Nebula (easy)
  "water" "light" "space"
  # Level 3 - Orbit (easy)
  "heart" "stone" "flame" "ocean"
  # Level 4 - Solar Flare (medium)
  "grain" "blaze" "frost"
  # Level 5 - Asteroid Belt (medium)
  "dwarf" "swirl" "prism" "crypt"
  # Level 6 - Deep Space (medium)
  "quirk" "plumb" "brine" "forge"
  # Level 7 - Black Hole (hard)
  "nymph" "fjord" "wryly"
  # Level 8 - Quasar (hard)
  "lymph" "pygmy" "cynic" "caulk"
  # Level 9 - Supernova (hard)
  "epoxy" "hyper" "knack" "whelk" "dough"
  # Level 10 - Event Horizon (expert)
  "azure" "bayou" "helix" "ivory" "juicy"
)

echo "==> Setting ${#WORDS[@]} campaign words on contract $CONTRACT"
echo "    Source identity: $SOURCE"
echo "    Network: $NETWORK"
echo ""

for word in "${WORDS[@]}"; do
  echo -n "  Setting word: $word ... "
  stellar contract invoke \
    --id "$CONTRACT" \
    --source "$SOURCE" \
    --network "$NETWORK" \
    -- set_word --word "$word" 2>&1 | tail -1
done

echo ""
echo "==> Done! All campaign words set."
echo "    Current day: $(stellar contract invoke --id $CONTRACT --network $NETWORK -- get_day 2>&1 | tail -1)"
