#!/usr/bin/env python3
"""Claude Code PreToolUse guard for destructive Bash commands.

For safe commands the hook stays silent so the normal Claude Code permission
system still applies. It only emits a structured deny decision for patterns
that must never run automatically in this repository.
"""
from __future__ import annotations

import json
import re
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    # Malformed or unexpected input must not create an accidental blanket allow.
    sys.exit(0)

if payload.get("tool_name") != "Bash":
    sys.exit(0)

command = str(payload.get("tool_input", {}).get("command", ""))
patterns = [
    r"(^|[;&|])\s*rm\s+-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)\s+/(?:\s|$)",
    r"(^|[;&|])\s*rm\s+-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)\s+(?:~|\$HOME)(?:/|\s|$)",
    r"\bgit\s+push\b[^\n;&|]*--force(?:-with-lease)?\b",
    r"\bgit\s+reset\s+--hard\b",
    r"\bgit\s+clean\b[^\n;&|]*-(?:[a-z]*f[a-z]*d|[a-z]*d[a-z]*f)[a-z]*\b",
    r"\bkubectl\s+delete\b",
    r"\bterraform\s+destroy\b",
    r"\bdocker\s+system\s+prune\b[^\n;&|]*-a\b",
    r"\bDROP\s+(?:DATABASE|SCHEMA)\b",
    r"\bpsql\b[^\n;&|]*(?:production|prod)\b",
]

if any(re.search(pattern, command, re.IGNORECASE) for pattern in patterns):
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": (
                        "Action destructive ou ciblant un environnement de production "
                        "bloquée par la politique CNPM."
                    ),
                }
            }
        )
    )

# Safe commands produce no output: project permissions and user approval remain authoritative.
sys.exit(0)
