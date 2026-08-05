#!/usr/bin/env python3
"""
Casa Tapputi — Minificador CSS/JS (pre-deploy build step)
==========================================================
Uso:
  python3 scripts/minify.py assets/css/main.v4.css > assets/css/main.v4.min.css
  python3 scripts/minify.py --all                    # minifica todos los CSS/JS
  python3 scripts/minify.py --all --in-place         # reemplaza originales (⚠️)
  python3 scripts/minify.py --check                  # solo muestra ahorro estimado

Cero dependencias externas. Compatible con Python 3.8+.
"""

import re
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSS_DIR = PROJECT_ROOT / "assets" / "css"
JS_DIR = PROJECT_ROOT / "assets" / "js"

# ── CSS Minification ──────────────────────────────────────

def minify_css(content: str) -> str:
    """Conservative CSS minification. Preserves @import, url(), custom properties, etc."""
    
    # Remove /* */ comments
    content = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', ' ', content)
    
    # Protect data URIs and quoted URLs from whitespace collapse
    protected: dict[str, str] = {}
    counter = [0]
    
    def protect(m: re.Match) -> str:
        key = f"__PROTECTED_{counter[0]}__"
        protected[key] = m.group(0)
        counter[0] += 1
        return key
    
    # Protect url(...) contents
    content = re.sub(r'url\([^)]*\)', protect, content)
    # Protect quoted strings (single and double)
    content = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', protect, content)
    content = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'", protect, content)
    
    # Collapse whitespace
    content = re.sub(r'\s+', ' ', content)
    
    # Remove whitespace around these characters
    for char in '{}:;,>+~':
        content = content.replace(f' {char}', char)
        content = content.replace(f'{char} ', char)
    
    # Remove whitespace after ( and before )
    content = content.replace('( ', '(')
    content = content.replace(' )', ')')
    
    # Remove last semicolon before }
    content = content.replace(';}', '}')
    
    # Remove leading zeros from decimals: 0.5 → .5
    content = re.sub(r'(?<![.\d])0\.(\d)', r'.\1', content)
    
    # Compress hex colors: #aabbcc → #abc (only when all pairs match)
    content = re.sub(r'#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3', r'#\1\2\3', content)
    
    # Restore protected strings
    for key, value in protected.items():
        content = content.replace(key, value)
    
    # Remove unnecessary spaces around !important
    content = content.replace(' !important', '!important')
    
    # Trim
    return content.strip()


# ── JS Minification ───────────────────────────────────────

def minify_js(content: str) -> str:
    """
    Safe character-by-character JS minifier.
    Uses a state machine to guarantee strings, template literals,
    and escape sequences remain 100% untouched.
    """
    out: list[str] = []
    i = 0
    n = len(content)
    
    # State definitions
    CODE, STR_SQ, STR_DQ, STR_TMPL, BLK_COM, LIN_COM = range(6)
    state = CODE
    escape = False
    
    while i < n:
        c = content[i]
        prev = content[i-1] if i > 0 else ''
        
        if state == CODE:
            # 1. Block Comment /* ... */
            if c == '/' and i + 1 < n and content[i+1] == '*':
                state = BLK_COM
                i += 1
            # 2. Line Comment // (not after : or \)
            elif c == '/' and i + 1 < n and content[i+1] == '/' and prev not in (':', '\\'):
                state = LIN_COM
                i += 1
            # 3. Strings & Template Literals
            elif c == "'":
                state = STR_SQ
                out.append(c)
                escape = False
            elif c == '"':
                state = STR_DQ
                out.append(c)
                escape = False
            elif c == '`':
                state = STR_TMPL
                out.append(c)
                escape = False
            # 4. Whitespace collapse (only in CODE state)
            elif c in ' \t\n\r':
                if out and out[-1] != ' ':
                    out.append(' ')
            # 5. Normal character
            else:
                out.append(c)
                
        elif state in (STR_SQ, STR_DQ, STR_TMPL):
            out.append(c)
            # Handle escape sequences
            if escape:
                escape = False
            elif c == '\\':
                escape = True
            else:
                # Close string if matching unescaped quote is found
                if (state == STR_SQ and c == "'") or \
                   (state == STR_DQ and c == '"') or \
                   (state == STR_TMPL and c == '`'):
                    state = CODE
                    
        elif state == BLK_COM:
            # Look for closing */
            if c == '*' and i + 1 < n and content[i+1] == '/':
                state = CODE
                i += 1
                # Insert space to prevent accidental token merging
                if out and out[-1] != ' ':
                    out.append(' ')
                    
        elif state == LIN_COM:
            # End of line comment
            if c in '\n\r':
                state = CODE
                # Keep a single space fallback
                if out and out[-1] != ' ':
                    out.append(' ')
        
        i += 1
        
    return "".join(out).strip()


# ── File Handling ─────────────────────────────────────────

def minify_file(filepath: Path, in_place: bool = False) -> tuple[int, int]:
    """Minify a single file. Returns (original_bytes, minified_bytes)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    ext = filepath.suffix.lower()
    if ext == '.css':
        minified = minify_css(original)
    elif ext == '.js':
        minified = minify_js(original)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    
    if in_place:
        # Backup original
        backup = filepath.with_suffix(filepath.suffix + '.bak')
        with open(backup, 'w', encoding='utf-8') as f:
            f.write(original)
        # Write minified
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(minified)
    else:
        # Write to .min. version
        outpath = filepath.with_name(filepath.stem + '.min' + filepath.suffix)
        with open(outpath, 'w', encoding='utf-8') as f:
            f.write(minified)
    
    return len(original.encode('utf-8')), len(minified.encode('utf-8'))


def find_assets() -> list[Path]:
    """Find all CSS and JS files in the project."""
    files = []
    if CSS_DIR.exists():
        files.extend(sorted(CSS_DIR.glob('*.css')))
    if JS_DIR.exists():
        files.extend(sorted(JS_DIR.glob('*.js')))
    return files


def restore_backups(directory: Path) -> int:
    """Restore .bak files to originals. Returns count of restored files."""
    count = 0
    for bak in sorted(directory.glob('*.bak')):
        orig = bak.with_suffix('')  # remove .bak
        # orig might have double suffix: file.css.bak → file.css
        if not orig.suffix:  # if we removed the only extension
            orig = bak  # shouldn't happen
        if bak.exists():
            with open(bak, 'r', encoding='utf-8') as f:
                content = f.read()
            # Find the actual original path
            stem = bak.name
            for ext in ['.css', '.js']:
                if stem.endswith(ext + '.bak'):
                    orig_path = directory / stem.replace(ext + '.bak', ext)
                    with open(orig_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    bak.unlink()
                    count += 1
                    break
    return count


# ── CLI ───────────────────────────────────────────────────

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Casa Tapputi — Minificador CSS/JS pre-deploy'
    )
    parser.add_argument(
        'files', nargs='*',
        help='Archivos CSS/JS a minificar (si no se especifica, usar --all)'
    )
    parser.add_argument(
        '--all', action='store_true',
        help='Minificar todos los CSS/JS en assets/'
    )
    parser.add_argument(
        '--in-place', action='store_true',
        help='Reemplazar archivos originales (crea backup .bak). Sin esto, genera .min. versiones.'
    )
    parser.add_argument(
        '--restore', action='store_true',
        help='Restaurar backups (.bak → originales)'
    )
    parser.add_argument(
        '--check', action='store_true',
        help='Solo mostrar estimación de ahorro, sin modificar archivos'
    )
    
    args = parser.parse_args()
    
    # Restore mode
    if args.restore:
        for d in [CSS_DIR, JS_DIR]:
            if d.exists():
                n = restore_backups(d)
                if n:
                    print(f"♻️  {d.relative_to(PROJECT_ROOT)}: {n} archivos restaurados")
        return
    
    # Determine files to process
    filepaths: list[Path] = []
    if args.all or (not args.files and not args.check):
        filepaths = find_assets()
    else:
        for f in args.files:
            p = Path(f)
            if not p.is_absolute():
                p = PROJECT_ROOT / p
            if p.exists():
                filepaths.append(p)
            else:
                print(f"⚠️  No encontrado: {f}", file=sys.stderr)
    
    if not filepaths:
        filepaths = find_assets()
    
    if not filepaths:
        print("No se encontraron archivos CSS/JS para minificar.")
        return
    
    # Process
    total_orig = 0
    total_min = 0
    results: list[tuple[str, int, int, float]] = []
    
    for fp in filepaths:
        try:
            if args.check:
                with open(fp, 'r', encoding='utf-8') as f:
                    original = f.read()
                ext = fp.suffix.lower()
                minified = minify_css(original) if ext == '.css' else minify_js(original)
                orig_b = len(original.encode('utf-8'))
                min_b = len(minified.encode('utf-8'))
            else:
                orig_b, min_b = minify_file(fp, in_place=args.in_place)
            
            saved = orig_b - min_b
            pct = (saved / orig_b * 100) if orig_b > 0 else 0
            rel = fp.relative_to(PROJECT_ROOT)
            results.append((str(rel), orig_b, min_b, pct))
            total_orig += orig_b
            total_min += min_b
        except Exception as e:
            print(f"❌ Error en {fp.relative_to(PROJECT_ROOT)}: {e}", file=sys.stderr)
    
    # Report
    saved_total = total_orig - total_min
    pct_total = (saved_total / total_orig * 100) if total_orig > 0 else 0
    
    print()
    print(f"{'Archivo':<45} {'Original':>8} {'Min':>8} {'Ahorro':>7}")
    print("-" * 72)
    for name, orig, min_b, pct in results:
        saved = orig - min_b
        print(f"{name:<45} {orig:>5.0f}KB {min_b:>5.0f}KB {saved:>4.0f}KB ({pct:>4.0f}%)")
    print("-" * 72)
    print(f"{'TOTAL':<45} {total_orig/1024:>5.1f}KB {total_min/1024:>5.1f}KB {saved_total/1024:>4.1f}KB ({pct_total:>4.0f}%)")
    
    if args.check:
        print(f"\n💡 Ahorro estimado: {saved_total/1024:.1f}KB ({pct_total:.0f}%)")
        print(f"   Para minificar: python3 scripts/minify.py --all")
        print(f"   Para minificar in-place: python3 scripts/minify.py --all --in-place")
    elif args.in_place:
        print(f"\n✅ {len(results)} archivos minificados in-place ({saved_total/1024:.1f}KB ahorrados)")
        print(f"   Backups guardados como .bak. Para restaurar: python3 scripts/minify.py --restore")
    else:
        print(f"\n✅ {len(results)} archivos .min. generados ({saved_total/1024:.1f}KB ahorrados)")


if __name__ == '__main__':
    main()
