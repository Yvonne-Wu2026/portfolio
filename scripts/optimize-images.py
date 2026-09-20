#!/usr/bin/env python3
"""
Downscale and re-encode everything in public/images, then rewrite the
references in src/.

Uses only macOS `sips`, which cannot write WebP. Opaque images become JPEG;
images that genuinely use their alpha channel stay PNG. Install `cwebp`
(brew install webp) for a further ~40% on top of this.

    python3 scripts/optimize-images.py --dry-run
    python3 scripts/optimize-images.py
"""
import argparse, pathlib, re, shutil, struct, subprocess, sys, tempfile, zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES, SRC = ROOT / 'public' / 'images', ROOT / 'src'
MAX_WIDTH, JPEG_QUALITY = 1920, 80   # 1920 covers 2x retina for every slot here


def dims(path):
    d = path.read_bytes()
    if d[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', d[16:24])
    i = 2
    while i < len(d):
        if d[i] != 0xFF:
            i += 1; continue
        if d[i + 1] in range(0xC0, 0xD0) and d[i + 1] not in (0xC4, 0xC8, 0xCC):
            h, w = struct.unpack('>HH', d[i + 5:i + 9]); return w, h
        i += 2 + struct.unpack('>H', d[i + 2:i + 4])[0]
    raise ValueError(f'no dimensions: {path}')


def sips(*args):
    subprocess.run(['sips', *map(str, args)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def uses_alpha(path):
    """True if any pixel is actually transparent. Checked on a small copy,
    since unfiltering a full-size PNG in pure Python is far too slow."""
    d = path.read_bytes()
    if d[:8] != b'\x89PNG\r\n\x1a\n':
        return False
    _, _, bit_depth, colour = struct.unpack('>IIBB', d[16:26])
    if colour not in (4, 6):
        return False                      # no alpha channel at all
    with tempfile.TemporaryDirectory() as tmp:
        small = pathlib.Path(tmp) / 'a.png'
        sips('-Z', 400, path, '--out', small)
        d = small.read_bytes()
        w, h, bit_depth, colour = struct.unpack('>IIBB', d[16:26])
        if colour not in (4, 6) or bit_depth != 8:
            return colour in (4, 6)
        idat, i = b'', 8
        while i < len(d):
            length = struct.unpack('>I', d[i:i + 4])[0]
            kind = d[i + 4:i + 8]
            if kind == b'IDAT':
                idat += d[i + 8:i + 8 + length]
            elif kind == b'IEND':
                break
            i += 12 + length
        raw = zlib.decompress(idat)
        ch = 4 if colour == 6 else 2
        stride, pos, prev = w * ch, 0, bytearray(w * ch)
        for _ in range(h):
            f = raw[pos]; pos += 1
            line = bytearray(raw[pos:pos + stride]); pos += stride
            if f == 1:
                for x in range(ch, stride):
                    line[x] = (line[x] + line[x - ch]) & 255
            elif f == 2:
                for x in range(stride):
                    line[x] = (line[x] + prev[x]) & 255
            elif f == 3:
                for x in range(stride):
                    a = line[x - ch] if x >= ch else 0
                    line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
            elif f == 4:
                for x in range(stride):
                    a = line[x - ch] if x >= ch else 0
                    b, c = prev[x], (prev[x - ch] if x >= ch else 0)
                    p = a + b - c
                    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                    line[x] = (line[x] + pr) & 255
            if any(line[x] < 250 for x in range(ch - 1, stride, ch)):
                return True
            prev = line
    return False


def rewrite_references(renames):
    """Point src/ at the new filenames."""
    changed = []
    for path in SRC.rglob('*'):
        if path.suffix not in {'.astro', '.ts'}:
            continue
        text = original = path.read_text()
        for old, new in renames.items():
            text = text.replace(f'/images/{old}', f'/images/{new}')
        if text != original:
            path.write_text(text)
            changed.append(path.relative_to(ROOT))
    return changed


def to_webp(args):
    """Re-encode with cwebp. Lossy q85 with alpha_q 100 beats lossless on
    everything here: these images carry photographic gradients that lossless
    cannot model, so lossless lands larger than the source PNG."""
    if not shutil.which('cwebp'):
        sys.exit('cwebp not found - install it with: brew install webp')

    suffixes = {'.png'} | ({'.jpg', '.jpeg'} if args.include_jpeg else set())
    targets = sorted(p for p in IMAGES.iterdir() if p.suffix.lower() in suffixes)
    if not targets:
        print('nothing to convert')
        return

    renames, before_total, after_total = {}, 0, 0
    for src in targets:
        before = src.stat().st_size
        before_total += before
        dest = src.with_suffix('.webp')

        if args.dry_run:
            print(f'  {src.name:34} {before // 1024:5} KB -> {dest.name}')
            continue

        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp) / 'o.webp'
            subprocess.run(['cwebp', '-quiet', '-q', '85', '-alpha_q', '100',
                            '-m', '6', str(src), '-o', str(out)], check=True)
            after = out.stat().st_size
            if after >= before:
                print(f'  {src.name:34} {before // 1024:5} KB  kept (webp no smaller)')
                after_total += before
                continue
            shutil.copy(out, dest)

        src.unlink()
        renames[src.name] = dest.name
        after_total += after
        print(f'  {src.name:34} {before // 1024:5} KB -> {after // 1024:5} KB '
              f'({100 - after * 100 // before:2}% smaller)')

    if args.dry_run:
        return
    if renames:
        print('\nreferences rewritten in:')
        for c in rewrite_references(renames):
            print(f'  {c}')
    print(f'\ntotal {before_total // 1024} KB -> {after_total // 1024} KB '
          f'({100 - after_total * 100 // before_total}% smaller)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--webp', action='store_true',
                    help='convert to WebP with cwebp (keeps the original where it is smaller)')
    ap.add_argument('--include-jpeg', action='store_true',
                    help='with --webp, convert JPEGs too, not just PNGs')
    args = ap.parse_args()

    if args.webp:
        return to_webp(args)

    originals = sorted(p for p in IMAGES.iterdir()
                       if p.suffix.lower() in {'.png', '.jpg', '.jpeg'})
    if not originals:
        sys.exit('no images found')

    backup = ROOT / '.image-backup'
    if not args.dry_run:
        if backup.exists():
            shutil.rmtree(backup)
        shutil.copytree(IMAGES, backup)
        print(f'originals backed up to {backup.relative_to(ROOT)}\n')

    renames, before_total, after_total = {}, 0, 0
    for src in originals:
        w, h = dims(src)
        before = src.stat().st_size
        before_total += before
        alpha = uses_alpha(src)
        target_ext = '.png' if alpha else '.jpg'
        dest = src.with_suffix(target_ext)
        new_w = min(w, MAX_WIDTH)

        if args.dry_run:
            note = 'keep PNG (uses alpha)' if alpha else 'to JPEG'
            resize = f'{w}->{new_w}px' if new_w != w else f'{w}px'
            print(f'  {src.name:34} {before // 1024:5} KB  {resize:14} {note}')
            continue

        with tempfile.TemporaryDirectory() as tmp:
            work = pathlib.Path(tmp) / f'w{src.suffix}'
            shutil.copy(src, work)
            if new_w != w:
                sips('--resampleWidth', new_w, work, '--out', work)
            out = pathlib.Path(tmp) / f'o{target_ext}'
            if target_ext == '.jpg':
                sips('-s', 'format', 'jpeg', '-s', 'formatOptions', JPEG_QUALITY,
                     work, '--out', out)
            else:
                sips('-s', 'format', 'png', work, '--out', out)
            after = out.stat().st_size
            if after >= before and new_w == w:
                print(f'  {src.name:34} {before // 1024:5} KB  kept (no gain)')
                after_total += before
                continue
            if dest != src:
                src.unlink()
                renames[src.name] = dest.name
            shutil.copy(out, dest)

        after_total += after
        pct = 100 - after * 100 // before
        print(f'  {src.name:34} {before // 1024:5} KB -> {after // 1024:5} KB  ({pct:2}% smaller)'
              + (f'  [{dest.name}]' if dest.name != src.name else ''))

    if args.dry_run:
        return

    if renames:
        changed = []
        for path in SRC.rglob('*'):
            if path.suffix not in {'.astro', '.ts'}:
                continue
            text = original = path.read_text()
            for old, new in renames.items():
                text = text.replace(f'/images/{old}', f'/images/{new}')
            if text != original:
                path.write_text(text)
                changed.append(path.relative_to(ROOT))
        print('\nreferences rewritten in:')
        for c in changed:
            print(f'  {c}')

    print(f'\ntotal {before_total // 1024} KB -> {after_total // 1024} KB '
          f'({100 - after_total * 100 // before_total}% smaller)')


if __name__ == '__main__':
    main()
