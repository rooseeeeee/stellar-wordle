#!/usr/bin/env bash
# ============================================================================
# Stellar Wordle — Systemd Timer Setup (alternative to cron)
#
# Installs a systemd timer that runs the daily word setter at 00:00 UTC.
# Systemd timers are more reliable than cron: they handle missed triggers
# (if the machine was off), have built-in logging, and retry on failure.
#
# Usage:
#   sudo ./scripts/systemd-setup.sh [install|uninstall|status|logs]
#
# Requires: root/sudo
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="stellar-wordle-daily"
SYSTEMD_DIR="/etc/systemd/system"

case "${1:-status}" in
  install)
    echo "🌟 Stellar Wordle — Installing systemd timer"
    echo ""

    if [[ $EUID -ne 0 ]]; then
      echo "  ❌ This command requires sudo/root."
      echo "  Run: sudo $0 install"
      exit 1
    fi

    # Copy service and timer files
    cp "$SCRIPT_DIR/systemd/$SERVICE_NAME.service" "$SYSTEMD_DIR/"
    cp "$SCRIPT_DIR/systemd/$SERVICE_NAME.timer" "$SYSTEMD_DIR/"

    # Reload systemd, enable and start the timer
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME.timer"
    systemctl start "$SERVICE_NAME.timer"

    echo "  ✅ Timer installed and started!"
    echo ""
    echo "  Timer status:"
    systemctl status "$SERVICE_NAME.timer" --no-pager | sed 's/^/    /'
    echo ""
    echo "  Next trigger:"
    systemctl list-timers "$SERVICE_NAME.timer" --no-pager | sed 's/^/    /'
    echo ""
    ;;

  uninstall)
    echo "🌟 Stellar Wordle — Removing systemd timer"
    echo ""

    if [[ $EUID -ne 0 ]]; then
      echo "  ❌ This command requires sudo/root."
      exit 1
    fi

    systemctl stop "$SERVICE_NAME.timer" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME.timer" 2>/dev/null || true
    rm -f "$SYSTEMD_DIR/$SERVICE_NAME.service" "$SYSTEMD_DIR/$SERVICE_NAME.timer"
    systemctl daemon-reload

    echo "  ✅ Timer removed."
    echo ""
    ;;

  status)
    echo "🌟 Stellar Wordle — Systemd Timer Status"
    echo ""

    if systemctl is-active --quiet "$SERVICE_NAME.timer" 2>/dev/null; then
      echo "  Status: ✅ ACTIVE"
      echo ""
      systemctl list-timers "$SERVICE_NAME.timer" --no-pager 2>/dev/null | sed 's/^/    /'
    else
      echo "  Status: ❌ NOT INSTALLED or INACTIVE"
      echo ""
      echo "  Run: sudo $0 install"
    fi
    echo ""
    ;;

  logs)
    echo "🌟 Stellar Wordle — Recent Logs"
    echo ""
    journalctl -u "$SERVICE_NAME.service" --no-pager -n 50 2>/dev/null | sed 's/^/  /' || \
      echo "  No journalctl logs found. Check data/logs/daily-word.log"
    echo ""
    ;;

  run)
    echo "🌟 Stellar Wordle — Manual trigger"
    echo ""
    systemctl start "$SERVICE_NAME.service" 2>/dev/null || \
      (echo "  Timer not installed. Running directly..." && \
       node "$SCRIPT_DIR/set-daily-word.mjs" --source deployer)
    echo ""
    ;;

  *)
    echo "Usage: $0 [install|uninstall|status|logs|run]"
    exit 1
    ;;
esac
