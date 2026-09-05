#!/usr/bin/env python3
"""Log this session's usage into the repo's usage.json.

Run at the end of any session that commits, from the repo root:

    python3 scripts/usage.py            # append/replace this session's row
    python3 scripts/usage.py --dry-run  # print the row, write nothing

What it measures (see docs/USAGE.md in dev-standards for what each means):
  tokens      exact, from the transcript Claude Code writes on disk, split
              input / cacheWrite / cacheRead / output, per model
  activeHours sum of gaps under 10 minutes between transcript events —
              wall-clock span is useless because a session sleeps for days
  turns, toolCalls   counts from the same transcript
  commits     commits whose trailer names this session (Claude-Session: …)

What it does NOT write: dollars, kWh, or anything derived from a rate. Those
are computed at read time from dev-standards/templates/rate-card.json, so a
price change never leaves a stale number in a repo. The row records only the
rate-card version it expects.

Idempotent: a session that closes twice replaces its own row.
"""
import argparse
import datetime as dt
import glob
import json
import os
import subprocess
import sys

ENVELOPE = 1
KIND = "usage"
RATE_CARD = 1
IDLE_GAP_S = 600

ZERO = {"input": 0, "cacheWrite": 0, "cacheRead": 0, "output": 0}
FIELD = {
    "input_tokens": "input",
    "cache_creation_input_tokens": "cacheWrite",
    "cache_read_input_tokens": "cacheRead",
    "output_tokens": "output",
}


def project_dir(repo_root):
    enc = os.path.abspath(repo_root).replace("/", "-")
    return os.path.join(os.path.expanduser("~"), ".claude", "projects", enc)


def find_transcripts(repo_root, session):
    d = project_dir(repo_root)
    if not os.path.isdir(d):
        return None, []
    tops = sorted(glob.glob(os.path.join(d, "*.jsonl")), key=os.path.getmtime)
    if not tops:
        return None, []
    if session:
        main = os.path.join(d, session + ".jsonl")
        if not os.path.exists(main):
            return session, []
    else:
        main = tops[-1]
        session = os.path.basename(main)[:-6]
    subs = glob.glob(os.path.join(d, session, "**", "*.jsonl"), recursive=True)
    return session, [main] + sorted(subs)


def parse_ts(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))


def measure(files):
    tot = dict(ZERO)
    by_model = {}
    stamps = []
    turns = tool_calls = 0
    for f in files:
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("timestamp"):
                    try:
                        stamps.append(parse_ts(d["timestamp"]))
                    except ValueError:
                        pass
                m = d.get("message") or {}
                u = m.get("usage")
                if d.get("type") != "assistant" or not u:
                    continue
                model = m.get("model") or "unknown"
                if model.startswith("<"):  # synthetic rows carry no real usage
                    continue
                turns += 1
                bm = by_model.setdefault(model, dict(ZERO, turns=0))
                bm["turns"] += 1
                for k, name in FIELD.items():
                    v = u.get(k) or 0
                    tot[name] += v
                    bm[name] += v
                for c in m.get("content") or []:
                    if isinstance(c, dict) and c.get("type") == "tool_use":
                        tool_calls += 1
    stamps.sort()
    active = 0.0
    for a, b in zip(stamps, stamps[1:]):
        g = (b - a).total_seconds()
        if g < IDLE_GAP_S:
            active += g
    span = (stamps[0], stamps[-1]) if stamps else (None, None)
    return tot, by_model, span, round(active / 3600, 2), turns, tool_calls


def commits_for(repo_root, remote_session):
    if not remote_session:
        return None
    key = remote_session.split("_", 1)[-1]  # cse_XXXX and session_XXXX share XXXX
    try:
        out = subprocess.run(
            ["git", "-C", repo_root, "log", "--all", "--format=%H", "--grep", "Claude-Session:.*" + key],
            capture_output=True, text=True, check=True,
        ).stdout.split()
        return len(out)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def iso(t):
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if t else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--session", default=os.environ.get("CLAUDE_CODE_SESSION_ID"),
                    help="transcript id (default: $CLAUDE_CODE_SESSION_ID, else newest transcript)")
    ap.add_argument("--file", default="usage.json", help="register file, relative to repo root")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    root = os.path.abspath(a.repo_root)
    session, files = find_transcripts(root, a.session)
    if not files:
        print("usage: no transcript found under", project_dir(root), file=sys.stderr)
        print("       (nothing written — this is not an error to paper over; say so in the report)", file=sys.stderr)
        return 2

    tot, by_model, (t0, t1), active, turns, tool_calls = measure(files)
    remote = os.environ.get("CLAUDE_CODE_REMOTE_SESSION_ID")
    row = {
        "session": session,
        "remoteSession": remote,
        "from": iso(t0),
        "to": iso(t1),
        "activeHours": active,
        "turns": turns,
        "toolCalls": tool_calls,
        "tokens": tot,
        "byModel": by_model,
        "commits": commits_for(root, remote),
        "transcripts": len(files),
        "rateCard": RATE_CARD,
    }

    path = os.path.join(root, a.file)
    doc = None
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            try:
                doc = json.load(fh)
            except ValueError:
                print("usage: %s is not JSON; refusing to overwrite it" % a.file, file=sys.stderr)
                return 1
    if doc is None:
        doc = {"envelope": ENVELOPE, "kind": KIND, "at": None, "payload": {"sessions": []}}
    if doc.get("envelope", 0) > ENVELOPE or doc.get("kind") != KIND or "payload" not in doc:
        print("usage: %s has envelope %s kind %s; this script knows envelope %d kind %s — refusing"
              % (a.file, doc.get("envelope"), doc.get("kind"), ENVELOPE, KIND), file=sys.stderr)
        return 1
    rows = doc["payload"].setdefault("sessions", [])
    rows[:] = [r for r in rows if r.get("session") != session] + [row]
    rows.sort(key=lambda r: r.get("from") or "")
    doc["at"] = iso(dt.datetime.now(dt.timezone.utc))

    total = sum(tot.values())
    hit = tot["cacheRead"] / max(1, tot["input"] + tot["cacheWrite"] + tot["cacheRead"])
    print("usage: session %s · %s turns · %s tool calls · %.1f active h · %s tokens (%.0f%% cache reads) · commits %s"
          % (session[:8], turns, tool_calls, active, f"{total:,}", hit * 100, row["commits"]))
    if a.dry_run:
        print(json.dumps(row, indent=2))
        return 0
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")
    print("usage: wrote", a.file, "·", len(rows), "session(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
