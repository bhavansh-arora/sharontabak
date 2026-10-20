#!/usr/bin/env python3
"""Sync shared partials into every page.

Each page contains markers like:

    <!-- include:header -->
    ...anything (replaced on every build)...
    <!-- /include:header -->

Run `python3 build.py` after editing anything in /partials. The pages stay
plain HTML, so the site can be hosted anywhere with no build step on the server.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
PARTIALS = ROOT / "partials"
MARKER = re.compile(r"(<!-- include:(\w+) -->)(.*?)(<!-- /include:\2 -->)", re.S)
PAGE = re.compile(r'<body[^>]*data-page="([\w-]+)"')


def render(name: str, page: str) -> str:
    html = (PARTIALS / f"{name}.html").read_text(encoding="utf-8").strip("\n")
    # Mark the current page in navigation
    html = html.replace(f'data-nav="{page}"', f'data-nav="{page}" aria-current="page"')
    return html


def build() -> None:
    for path in sorted(ROOT.glob("*.html")):
        src = path.read_text(encoding="utf-8")
        m = PAGE.search(src)
        page = m.group(1) if m else ""

        def sub(match: re.Match) -> str:
            start, name, _, end = match.groups()
            return f"{start}\n{render(name, page)}\n{end}"

        out = MARKER.sub(sub, src)
        if out != src:
            path.write_text(out, encoding="utf-8")
            print(f"built {path.name}")
        else:
            print(f"ok    {path.name}")


if __name__ == "__main__":
    build()
