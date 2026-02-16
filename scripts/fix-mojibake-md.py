#!/usr/bin/env python3
"""
Fixes common UTF-8-as-Latin1 mojibake in Markdown docs.

Heuristic:
- Only touch files that contain strong mojibake markers like "Ã§", "â€”", "ðŸ".
- Apply latin1->utf8 re-decode of the whole file.
- Keep change only if the mojibake marker score strictly improves.
"""

from __future__ import annotations

import os
import re
import subprocess
from typing import List, Tuple


MOJI_RE = re.compile(
    # Common UTF-8-as-cp1252 / UTF-8-as-latin1 mojibake starters:
    # - "Ã" followed by a continuation-ish char or letter (ex: "Ã§", "Ã\x8d")
    # - "Â" used as stray prefix (ex: "Â©", "Â ")
    # - "â" sequences (ex: "â€”", "âœ…", "â”Œ")
    # - "ðŸ" sequences for emojis/flags
    # Note: don't match "\u00c3" followed by uppercase letters; sequences like "NÃO"
    # (N + Ã + O) are valid Portuguese. Mojibake typically appears as "Ã" + lowercase
    # or "Ã" + C1/continuation bytes.
    r"(?:\u00c3[\u0080-\u00bfa-z])"
    r"|(?:\u00c2[\u0080-\u00bf ])"
    # "â…" sequences are almost always mojibake for punctuation/box drawing/emojis, not Portuguese words.
    r"|(?:\u00e2[\u0080-\u009f\u00a0-\u00bf\u0152\u0153\u2018-\u201f\u2020-\u2022\u20ac])"
    r"|(?:\u00f0\u0178)"
    # Raw C1 control codes frequently appear inside mojibake (ex: "Ã\x8d").
    r"|(?:[\u0080-\u009f])"
)


def score(s: str) -> int:
    return len(MOJI_RE.findall(s))


def git_list_md() -> List[str]:
    tracked = subprocess.check_output(["git", "ls-files", "*.md"], text=True).splitlines()
    untracked = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "*.md"], text=True
    ).splitlines()
    return sorted(set(tracked + untracked))


_CP1252_UNDEFINED = {0x81, 0x8D, 0x8F, 0x90, 0x9D}


def cp1252_lossless_bytes(s: str) -> bytes:
    """
    Convert a str to the original single-byte stream that likely produced it when
    decoded as cp1252, including the 5 undefined bytes Python can't encode.
    """

    out = bytearray()
    for ch in s:
        o = ord(ch)
        if o in _CP1252_UNDEFINED:
            out.append(o)
            continue
        b = ch.encode("cp1252")
        if len(b) != 1:
            raise UnicodeEncodeError("cp1252", ch, 0, 1, "expected 1-byte encoding")
        out.extend(b)
    return bytes(out)


def main() -> int:
    files = [f for f in git_list_md() if not (f.startswith("node_modules/") or f.startswith(".next/"))]

    changed: List[Tuple[str, int, int]] = []
    skipped: List[Tuple[str, str]] = []

    root = os.getcwd()
    for f in files:
        p = os.path.join(root, f)
        with open(p, "rb") as fp:
            data = fp.read()
        try:
            txt = data.decode("utf-8")
        except UnicodeDecodeError:
            skipped.append((f, "not-utf8"))
            continue

        s0 = score(txt)
        if s0 == 0:
            continue

        # Prefer a line-by-line fix. This avoids breaking files that are "mixed"
        # (some lines already correct UTF-8, some lines still mojibake).
        # Encoding used: cp1252 first (best for mojibake punctuation), then latin1
        # (handles C1 control codes that cp1252 cannot encode).
        lines = txt.splitlines(keepends=True)
        out_lines: List[str] = []
        any_line_changed = False
        for line in lines:
            ls0 = score(line)
            if ls0 == 0:
                out_lines.append(line)
                continue

            bom = line.startswith("\ufeff")
            payload = line[1:] if bom else line

            fixed_line = None
            # Prefer cp1252 round-trip (handles punctuation/box-drawing mojibake).
            # Use a lossless encoder to keep cp1252 undefined bytes (0x81/0x8D/0x8F/0x90/0x9D).
            try:
                candidate = cp1252_lossless_bytes(payload).decode("utf-8")
                if score(candidate) < ls0:
                    fixed_line = ("\ufeff" + candidate) if bom else candidate
            except UnicodeError:
                fixed_line = None

            # Fallback: latin1 byte round-trip (rare, but helps in some edge cases).
            if fixed_line is None:
                try:
                    candidate = payload.encode("latin1").decode("utf-8")
                    if score(candidate) < ls0:
                        fixed_line = ("\ufeff" + candidate) if bom else candidate
                except UnicodeError:
                    fixed_line = None

            if fixed_line is None:
                out_lines.append(line)
            else:
                out_lines.append(fixed_line)
                any_line_changed = True

        if not any_line_changed:
            skipped.append((f, "no-improve"))
            continue

        fixed = "".join(out_lines)
        s1 = score(fixed)
        if s1 >= s0:
            skipped.append((f, f"no-improve {s0}->{s1}"))
            continue

        # Preserve line endings as much as possible (CRLF vs LF).
        if b"\r\n" in data:
            fixed = fixed.replace("\r\n", "\n").replace("\n", "\r\n")

        with open(p, "wb") as fp:
            fp.write(fixed.encode("utf-8"))
        changed.append((f, s0, s1))

    print(f"md_files={len(files)}")
    print(f"changed={len(changed)}")
    for f, a, b in changed:
        print(f"CHANGED {f} {a}->{b}")
    print(f"skipped={len(skipped)}")
    for f, why in skipped[:50]:
        print(f"SKIP {f} {why}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
