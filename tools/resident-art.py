#!/usr/bin/env python3
"""把立繪排成遊戲規格：1024×1024 透明畫布、腳底在 y=940、左右置中、WebP 品質 88。

用法：
  python3 tools/resident-art.py 原圖.png assets/characters/siang-118-xxx.webp
  python3 tools/resident-art.py 原圖.jpg 輸出.webp --white   # 原圖是白底：把跟邊框相連的白色去掉
  python3 tools/resident-art.py 原圖.png 輸出.webp --preview 預覽.png   # 另外輸出一張棋盤格底的預覽

去背要好看還是得人看：頭髮、頭紗、半透明的地方，用 --preview 的圖確認一次。
"""
import argparse
from PIL import Image, ImageDraw, ImageFilter

CANVAS, FEET, TOP_MIN, SIDE_MIN = 1024, 940, 40, 24


def remove_white(img, tol=18):
    """把跟四邊相連、接近白色的像素變透明，邊緣 7px 內做白底反混色（117 的做法）。"""
    rgb = img.convert('RGB')
    w, h = rgb.size
    gray = rgb.convert('L').point(lambda v: 255 if v >= 255 - tol else 0)
    mask = gray.copy()
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mask.getpixel(xy) == 255:
            ImageDraw.floodfill(mask, xy, 128)
    bg = mask.point(lambda v: 255 if v == 128 else 0)  # 跟邊框相連的白
    alpha = bg.point(lambda v: 0 if v else 255).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    px, ap = out.load(), alpha.load()
    near = bg.filter(ImageFilter.MaxFilter(15)).load()  # 離背景 7px 內
    for y in range(h):
        for x in range(w):
            a = ap[x, y]
            if a == 0:
                px[x, y] = (0, 0, 0, 0)
            elif near[x, y] and a < 255:
                r, g, b, _ = px[x, y]
                f = a / 255
                px[x, y] = tuple(max(0, min(255, round((c - 255 * (1 - f)) / f))) for c in (r, g, b)) + (a,)
            else:
                px[x, y] = px[x, y][:3] + (a,)
    return out


def layout(img):
    img = img.convert('RGBA')
    box = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if not box:
        raise SystemExit('整張圖都是透明的，沒有東西可以排')
    art = img.crop(box)
    w, h = art.size
    scale = min((FEET - TOP_MIN) / h, (CANVAS - 2 * SIDE_MIN) / w)
    art = art.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(art, ((CANVAS - art.width) // 2, FEET + 1 - art.height))
    return canvas


def checker(img):
    bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    d = ImageDraw.Draw(bg)
    for y in range(0, img.height, 32):
        for x in range(0, img.width, 32):
            if (x // 32 + y // 32) % 2:
                d.rectangle([x, y, x + 31, y + 31], fill=(222, 222, 222, 255))
    d.line([(0, FEET), (img.width, FEET)], fill=(255, 90, 140, 255), width=2)
    bg.alpha_composite(img)
    return bg


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--white', action='store_true', help='原圖是白底，自動去掉跟邊框相連的白色')
    ap.add_argument('--preview', help='另外輸出棋盤格底預覽（粉紅線是腳底 y=940）')
    a = ap.parse_args()
    src = Image.open(a.src)
    if max(src.size) > 2048:  # 手機原圖太大，先縮到 2048 再處理（最後也只用到 900px 高）
        src.thumbnail((2048, 2048), Image.LANCZOS)
    if a.white or src.mode not in ('RGBA', 'LA', 'P'):
        src = remove_white(src)
    out = layout(src)
    out.save(a.out, 'WEBP', quality=88, method=6)
    if a.preview:
        checker(out).convert('RGB').save(a.preview)
    bottom = out.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    print(f'{a.out}: 1024×1024，畫面範圍 y={bottom[1]}～{bottom[3] - 1}（腳底要在 936～941）')
