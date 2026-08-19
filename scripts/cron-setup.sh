#!/usr/bin/env bash
# ============================================================================
# Stellar Wordle — Cron Job Setup
#
# Sets up daily word rotation via cron. The word is set at 00:00 UTC each day
# using calendar-based procedural generation.
#
# Usage:
#   ./scripts/cron-setup.sh [install|uninstall|status|test]
#
# Commands:
#   install   - Install the cron job (runs daily at 00:00 UTC)
#   uninstall - Remove the cron job
#   status    - Show current cron status
#   test      - Run the daily word setter immediately (dry run)
#
# Requirements:
#   - Node.js >= 20
#   - Stellar CLI with 'deployer' identity configured
#   - This repo cloned at the expected path
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_ID="stellar-wordle-daily"
LOG_DIR="$PROJECT_DIR/data/logs"
LOG_FILE="$LOG_DIR/daily-word.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# The actual cron command
CRON_CMD="cd $PROJECT_DIR && /usr/bin/node scripts/set-daily-word.mjs --source wordle-deployer >> $LOG_FILE 2>&1"

# Cron schedule: 00:00 UTC every day
CRON_SCHEDULE="0 0 * * *"
CRON_ENTRY="$CRON_SCHEDULE $CRON_CMD # $CRON_ID"

case "${1:-status}" in
  install)
    echo "🌟 Stellar Wordle — Installing daily cron job"
    echo ""
    echo "  Schedule: Every day at 00:00 UTC"
    echo "  Command:  node scripts/set-daily-word.mjs --source deployer"
    echo "  Log:      $LOG_FILE"
    echo ""

    # Remove existing entry if present, then add new one
    (crontab -l 2>/dev/null | grep -v "$CRON_ID" ; echo "$CRON_ENTRY") | crontab -

    echo "  ✅ Cron job installed!"
    echo ""
    echo "  Verify with: crontab -l | grep stellar-wordle"
    echo "  Logs at:     $LOG_FILE"
    echo ""
    ;;

  uninstall)
    echo "🌟 Stellar Wordle — Removing daily cron job"
    echo ""

    crontab -l 2>/dev/null | grep -v "$CRON_ID" | crontab -

    echo "  ✅ Cron job removed."
    echo ""
    ;;

  status)
    echo "🌟 Stellar Wordle — Cron Status"
    echo ""

    if crontab -l 2>/dev/null | grep -q "$CRON_ID"; then
      echo "  Status: ✅ ACTIVE"
      echo ""
      echo "  Current entry:"
      crontab -l 2>/dev/null | grep "$CRON_ID" | sed 's/^/    /'
    else
      echo "  Status: ❌ NOT INSTALLED"
      echo ""
      echo "  Run: ./scripts/cron-setup.sh install"
    fi

    echo ""

    # Show recent logs if they exist
    if [[ -f "$LOG_FILE" ]]; then
      echo "  Recent log entries:"
      tail -20 "$LOG_FILE" 2>/dev/null | sed 's/^/    /'
    else
      echo "  No logs yet."
    fi
    echo ""
    ;;

  test)
    echo "🌟 Stellar Wordle — Test Run (preview only)"
    echo ""
    node "$PROJECT_DIR/scripts/set-daily-word.mjs" --preview 1
    echo ""
    echo "  To actually set today's word, run:"
    echo "    node scripts/set-daily-word.mjs --source deployer"
    echo ""
    ;;

  *)
    echo "Usage: $0 [install|uninstall|status|test]"
    exit 1
    ;;
esac
