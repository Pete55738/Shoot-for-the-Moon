#!/usr/bin/env python3
"""Build a run sheet: one HTML page, images inlined, from a folder of PNGs
and the repo's docs/QUEUE.md. Send it into the conversation as a file.

    python3 scripts/run-sheet.py --shots docs/shots --queue docs/QUEUE.md \
        --title "AI-Racer · run 4" --stamp "v0.1 (#34) · 2026-09-05" \
        --out /tmp/run-sheet.html [--note "what was not done"]...

Pictures first, one column, phone width — the user reads it on a phone
beside the conversation. Captions come from the file names: `pick-light.png`
reads as "pick · light". Files are ordered by name; prefix with digits to
control the order. Anything not a PNG is ignored.

The page is self-contained (data URIs) so it needs no network, which is what
the artifact sandbox allows. Keep the sheet under ~12 MB: at 390x844 @2x a
PNG is ~300 KB, so about thirty shots. Past that, drop the 2x.
"""
import argparse
import base64
import html
import os
import re
import sys


def caption(name):
    stem = os.path.splitext(name)[0]
    stem = re.sub(r"^\d+[-_]", "", stem)
    return " · ".join(p for p in re.split(r"[-_]", stem) if p)


def queue_html(path):
    if not path or not os.path.exists(path):
        return "<p class=muted>no queue file</p>"
    out = []
    for line in open(path, encoding="utf-8"):
        s = line.rstrip("\n")
        if s.startswith("## "):
            out.append(f"<h3>{html.escape(s[3:])}</h3>")
        elif s.startswith("- [x]"):
            out.append(f"<li class=built>{md(s[5:].strip())}</li>")
        elif s.startswith("- [ ]"):
            cls = "decided" if "**decided:**" in s else "queued"
            out.append(f"<li class={cls}>{md(s[5:].strip())}</li>")
        elif s.startswith("- ~~"):
            out.append(f"<li class=shipped>{md(s[2:].strip())}</li>")
    body = "\n".join(out)
    return re.sub(r"(<li[^>]*>.*?</li>\n?)+", lambda m: "<ul>" + m.group(0) + "</ul>", body, flags=re.S)


def md(s):
    s = html.escape(s)
    s = re.sub(r"~~(.+?)~~", r"<s>\1</s>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--shots", required=True)
    ap.add_argument("--queue", default="docs/QUEUE.md")
    ap.add_argument("--title", required=True)
    ap.add_argument("--stamp", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--note", action="append", default=[], help="a 'not done' line; repeatable")
    a = ap.parse_args()

    files = sorted(f for f in os.listdir(a.shots) if f.lower().endswith(".png"))
    if not files:
        print("run-sheet: no PNGs in", a.shots, file=sys.stderr)
        return 2
    figs = []
    total = 0
    for f in files:
        data = open(os.path.join(a.shots, f), "rb").read()
        total += len(data)
        figs.append(f'<figure><img src="data:image/png;base64,{base64.b64encode(data).decode()}" alt="{html.escape(caption(f))}"><figcaption>{html.escape(caption(f))}</figcaption></figure>')
    notes = "".join(f"<li>{html.escape(n)}</li>" for n in a.note)

    page = f"""<title>{html.escape(a.title)}</title>
<style>
:root{{--bg:#5E7A9B;--surface:#6D8AAB;--border:#14202D;--text:#06111C;--muted:#172A3F;--accent:#4FD9E6;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#1A2A40;--surface:#233752;--border:#3F5A7C;--text:#EAF2FA;--muted:#A6B8CC}}}}
:root[data-theme="dark"]{{--bg:#1A2A40;--surface:#233752;--border:#3F5A7C;--text:#EAF2FA;--muted:#A6B8CC}}
body{{background:var(--bg);color:var(--text);font-family:var(--sans);margin:0;padding:16px;max-width:440px;margin-inline:auto}}
h1{{font:800 18px var(--mono);letter-spacing:.1em;text-transform:uppercase;margin:0}}
.stamp{{font:11px var(--mono);color:var(--muted);margin:4px 0 16px}}
h2,h3{{font:700 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:22px 0 8px}}
figure{{margin:0 0 18px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px}}
img{{display:block;width:100%;height:auto;border-radius:3px}}
figcaption{{font:700 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:6px 2px 2px}}
ul{{list-style:none;padding:0;margin:0}} li{{font:13px/1.5 var(--sans);padding:6px 8px;border-bottom:1px solid var(--border)}}
li.decided{{border-left:3px solid var(--accent)}} li.built{{opacity:.85}} li.shipped{{color:var(--muted)}}
code{{font-family:var(--mono);font-size:.92em}} .muted{{color:var(--muted)}}
</style>
<h1>{html.escape(a.title)}</h1>
<div class=stamp>{html.escape(a.stamp)} · {len(files)} shots · {total // 1024} KB</div>
<h2>What it looks like now</h2>
{''.join(figs)}
<h2>Queue</h2>
{queue_html(a.queue)}
{('<h2>Not done</h2><ul>' + notes + '</ul>') if notes else ''}
"""
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    open(a.out, "w", encoding="utf-8").write(page)
    print(f"run-sheet: {a.out} · {len(files)} shots · {len(page) // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
