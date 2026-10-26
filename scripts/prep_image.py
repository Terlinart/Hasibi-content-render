"""عکس محصول را برای قالب آماده می‌کند: چرخش درست (EXIF)، اندازهٔ استاندارد، JPG.
عمداً پس‌زمینه را حذف نمی‌کنیم: روی عکس‌های واقعی داروخانه لبهٔ جعبه را خراب می‌کند.
استفاده: python3 scripts/prep_image.py input public/job/product.jpg
"""
import sys

from PIL import Image, ImageOps

src, dst = sys.argv[1], sys.argv[2]
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
im.thumbnail((1400, 1400))
im.save(dst, quality=92)
print("prepared", im.size)
