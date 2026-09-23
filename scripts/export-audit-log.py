"""Export an audit log of every AI tool action in a Hermes session.

Usage:  python scripts/export-audit-log.py [session_id] [YYYY-MM-DD]
Reads the local Hermes session database (read-only) and writes
docs/audit/AUDIT-LOG-<date>.md: one row per tool call with time (IST),
model, tool name and a short summary of its arguments. Secrets are masked.
"""
import json, os, re, sqlite3, sys
from datetime import datetime, timedelta, timezone

DB = os.path.expandvars(r"%LOCALAPPDATA%\hermes\state.db")
SESSION = sys.argv[1] if len(sys.argv) > 1 else "20260915_163358_21cf04"
DAY = sys.argv[2] if len(sys.argv) > 2 else datetime.now().strftime("%Y-%m-%d")
IST = timezone(timedelta(hours=5, minutes=30))
SECRET = re.compile(r"(re_[A-Za-z0-9_]{8,}|sb_[a-z]+_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_.-]{20,}|x-cron-secret: \S+|Bearer \S+)")

con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
con.row_factory = sqlite3.Row
cols = [r[1] for r in con.execute("pragma table_info(messages)")]
rows = con.execute("select * from messages where session_id=? order by id", (SESSION,)).fetchall()
model = con.execute("select * from sessions where id=?", (SESSION,)).fetchone()
model = dict(model).get("model", "?") if model else "?"

out = [f"# AI action audit log — {DAY}", "",
       f"Session `{SESSION}`, current model `{model}`. Generated {datetime.now(IST):%Y-%m-%d %H:%M} IST",
       "from the local Hermes session database (read-only). Secrets masked.", "",
       "| # | Time (IST) | Tool | What it did |", "|---|---|---|---|"]
n = 0
for r in rows:
    d = dict(r)
    ts = datetime.fromtimestamp(d["timestamp"], IST)
    if ts.strftime("%Y-%m-%d") != DAY:
        continue
    calls = d.get("tool_calls")
    if not calls:
        continue
    for c in json.loads(calls) if isinstance(calls, str) else calls:
        fn = c.get("function", {})
        try:
            args = json.loads(fn.get("arguments") or "{}")
        except Exception:
            args = {"raw": fn.get("arguments", "")}
        key = next((args[k] for k in ("command", "code", "url", "path", "query", "text", "action", "ref", "selector", "prompt") if k in args), json.dumps(args)[:150])
        summary = SECRET.sub("[MASKED]", " ".join(str(key).split()))[:220].replace("|", "\\|")
        n += 1
        out.append(f"| {n} | {ts:%H:%M:%S} | {fn.get('name')} | {summary} |")

out.insert(4, f"**{n} tool actions on {DAY}.**\n")
path = os.path.join(os.path.dirname(__file__), "..", "docs", "audit", f"AUDIT-LOG-{DAY}.md")
os.makedirs(os.path.dirname(path), exist_ok=True)
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(os.path.abspath(path), n)
