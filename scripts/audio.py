"""صدای ریلز: افکت‌های زیاد هماهنگ با هر حرکت روی تصویر + موزیک خیلی آرام در پس‌زمینه (بدون گوینده).
موزیک با کد ساخته می‌شود، پس هیچ مشکل کپی‌رایتی ندارد و هر ویدیو (با seed) ریتم و آکورد خودش را دارد.
استفاده: python3 scripts/audio.py job.json out/reel_silent.mp4 out/reel.mp4
"""
import json
import math
import random
import subprocess
import sys
import wave

import numpy as np

SR = 44100
FPS = 30
# باید با SCENE_LEN در src/Reel.tsx یکی باشد
SCENES = {"hook": 54, "glass": 120, "neon": 150, "poster": 96, "outro": 120}
TOTAL = sum(SCENES.values()) / FPS

job_path, video_in, video_out = sys.argv[1:4]
job = json.load(open(job_path, encoding="utf-8"))
seed = int(job.get("seed", 1))
rng = random.Random(seed)

# ---------- موزیک ----------
def env(n, a=0.005, r=0.3):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e


def music(total_s: float) -> np.ndarray:
    n = int(total_s * SR)
    out = np.zeros(n, dtype=np.float32)
    bpm = rng.choice([100, 104, 108, 112, 116, 120])
    beat = 60 / bpm
    root = rng.choice([45, 47, 48, 50, 52, 53])  # midi
    progs = [[0, 5, 3, 4], [0, 3, 5, 4], [0, 4, 5, 3], [5, 3, 0, 4]]
    prog = rng.choice(progs)
    scale = [0, 2, 4, 5, 7, 9, 11]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = beat * 4
    t = np.arange(n) / SR
    # پد آکوردی نرم
    for i in range(int(total_s / bar) + 1):
        deg = prog[i % 4]
        chord = [root + 12 + scale[(deg + k) % 7] + 12 * ((deg + k) // 7) for k in (0, 2, 4)]
        s0, s1 = int(i * bar * SR), min(n, int((i + 1) * bar * SR))
        if s0 >= n:
            break
        tt = t[s0:s1] - i * bar
        seg = sum(np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.003 * tt) for m in chord)
        fade = np.minimum(1, tt / 0.25) * np.minimum(1, (bar - tt) / 0.25)
        out[s0:s1] += 0.06 * seg * fade
        # بیس
        bass = np.sin(2 * np.pi * hz(root + scale[deg] - 12) * tt)
        out[s0:s1] += 0.10 * bass * np.minimum(1, tt / 0.02)
    # کیک و هت
    k = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 9)
    hat = np.random.default_rng(seed).standard_normal(int(0.05 * SR)) * env(int(0.05 * SR), 0.001, 0.012)
    hat = np.diff(hat, prepend=0)  # بالاگذر ساده
    pattern = rng.choice(["four", "half", "broken"])
    b = 0
    while b * beat < total_s - 0.4:
        p = int(b * beat * SR)
        if pattern == "four" or (pattern == "half" and b % 2 == 0) or (pattern == "broken" and b % 4 in (0, 2, 3)):
            e = min(n, p + len(kick))
            out[p:e] += 0.35 * kick[: e - p]
        hp = int((b + 0.5) * beat * SR)
        if hp + len(hat) < n:
            out[hp: hp + len(hat)] += 0.12 * hat
        b += 1
    # فید اول و آخر
    fade = np.minimum(1, t / 0.4) * np.minimum(1, (total_s - t) / 1.2)
    return out * fade


def whoosh(dur=0.45, rise=True):
    n = int(dur * SR)
    noise = np.random.default_rng(rng.randint(0, 1 << 30)).standard_normal(n)
    # فیلتر پایین‌گذر با فرکانس متغیر (جاروب)
    out = np.zeros(n)
    y = 0.0
    for i in range(n):
        x = i / n
        a = 0.02 + 0.5 * (x if rise else 1 - x) ** 2
        y += a * (noise[i] - y)
        out[i] = y
    shape = np.sin(np.pi * np.arange(n) / n) ** 1.5
    return (out * shape / (np.max(np.abs(out)) + 1e-9)).astype(np.float32)


def impact():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    f = rng.choice([45, 55, 65])
    return (np.sin(2 * np.pi * f * tt * (1 + np.exp(-tt * 20))) * np.exp(-tt * 6)).astype(np.float32)


def ding():
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    f = rng.choice([1320, 1568, 1760])
    return ((np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 9)).astype(np.float32)


def place(buf, clip, at_s, gain):
    p = int(at_s * SR)
    if p < 0 or p >= len(buf):
        return
    e = min(len(buf), p + len(clip))
    clip = clip / (np.max(np.abs(clip)) + 1e-9)  # هر افکت با بلندی یکسان، بعد gain
    buf[p:e] += gain * clip[: e - p]


# ---------- افکت‌های بیشتر (همه با کد ساخته می‌شوند؛ بدون کپی‌رایت) ----------
def _t(d):
    return np.arange(int(d * SR)) / SR


def pop():
    t = _t(0.09)
    f0 = rng.uniform(500, 900)
    ph = 2 * np.pi * np.cumsum(f0 * np.exp(-t * 18) + 180) / SR
    return (np.sin(ph) * np.exp(-t * 45)).astype(np.float32)


def click():
    t = _t(0.03)
    n = np.random.default_rng(rng.randint(0, 1 << 30)).standard_normal(len(t))
    n = np.diff(n, prepend=0)
    return ((0.6 * n + np.sin(2 * np.pi * rng.uniform(1800, 3200) * t)) * np.exp(-t * 220)).astype(np.float32)


def zap():
    t = _t(0.22)
    f = rng.uniform(1600, 2600) * np.exp(-t * 14) + 120
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    am = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 55 * t))
    return (saw * am * np.exp(-t * 12)).astype(np.float32) * 0.7


def glitch():
    d = 0.16
    out = np.zeros(int(d * SR), dtype=np.float32)
    g = np.random.default_rng(rng.randint(0, 1 << 30))
    pos = 0
    while pos < len(out):
        L = int(g.uniform(0.008, 0.025) * SR)
        if g.random() < 0.6:
            seg = np.round(g.standard_normal(L) * 3) / 3  # بیت‌کراش
            out[pos:pos + L] = seg[: len(out[pos:pos + L])] * 0.5
        pos += L
    return out


def shimmer(d=0.9):
    t = _t(d)
    sig = sum(np.sin(2 * np.pi * rng.uniform(2500, 6000) * t + rng.random() * 6) for _ in range(6)) / 6
    envl = np.minimum(1, t / (d * 0.35)) * np.exp(-np.maximum(0, t - d * 0.35) * 5)
    return (sig * envl).astype(np.float32)


def riser(d=0.9):
    t = _t(d)
    ph = 2 * np.pi * np.cumsum(200 + 1400 * (t / d) ** 2) / SR
    tone = np.sin(ph) * (t / d) ** 2
    return (0.6 * tone + 0.6 * whoosh(d, True)[: len(t)]).astype(np.float32)


def boom():
    return (impact() + 0.5 * np.concatenate([click(), np.zeros(len(impact()) - len(click()), dtype=np.float32)])).astype(np.float32)


def shutter():
    a, b = click(), click()
    gap = np.zeros(int(0.05 * SR), dtype=np.float32)
    return np.concatenate([a, gap, b])


def main():
    total = TOTAL
    n = int(total * SR)
    # موزیک فقط یک بستر آرام زیر افکت‌هاست
    mix = music(total) * 0.22
    fx = np.zeros(n, dtype=np.float32)
    F = 1 / FPS

    order = ["hook"] + [["glass", "neon", "poster"], ["neon", "glass", "poster"], ["glass", "poster", "neon"]][abs(seed) % 3] + ["outro"]
    cut_fx = [boom, glitch, lambda: whoosh(0.45, True), zap]
    rng.shuffle(cut_fx)
    t0 = 0.0
    for si, k in enumerate(order):
        # برش صحنه (فلش + پانچ زوم)
        if si == 0:
            place(fx, boom(), 0.0, 0.9)
        else:
            place(fx, riser(0.6), t0 - 0.6, 0.35)
            place(fx, cut_fx[si % len(cut_fx)](), t0, 0.8)

        if k == "hook":
            words = str(job.get("hook", "")).split()
            for i in range(len(words)):
                place(fx, pop(), t0 + (4 + i * 4) * F, 0.75)
            place(fx, ding(), t0 + 10 * F, 0.35)  # لوگو
        elif k == "glass":
            place(fx, whoosh(0.5, False), t0, 0.5)  # کارت بالا می‌آید
            place(fx, shimmer(1.6), t0 + 10 * F, 0.45)  # نور روی شیشه
            place(fx, click(), t0 + 22 * F, 0.6)  # چیپ
        elif k == "neon":
            for i, _ in enumerate(job.get("ingredients", [])[:4]):
                place(fx, zap(), t0 + (10 + i * 14) * F, 0.6)
                place(fx, click(), t0 + (14 + i * 14) * F, 0.35)
            for i, _ in enumerate(job.get("badges", [])[:3]):
                place(fx, pop(), t0 + (82 + i * 5) * F, 0.5)
        elif k == "poster":
            place(fx, whoosh(0.35, True), t0, 0.6)  # برش مورب
            place(fx, boom(), t0 + 6 * F, 0.7)  # اسم محصول
            place(fx, click(), t0 + 22 * F, 0.5)
        elif k == "outro":
            place(fx, riser(0.5), t0, 0.4)  # چرخش لوگو
            place(fx, boom(), t0 + 14 * F, 0.6)
            place(fx, shutter(), t0 + 20 * F, 0.6)  # QR
            place(fx, ding(), t0 + 28 * F, 0.4)
            place(fx, shimmer(1.2), t0 + 30 * F, 0.3)
        t0 += SCENES[k] / FPS

    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.18 + fx * 0.85
    mix = np.tanh(mix * 2.6)  # لیمیتر نرم تا افکت‌ها پرقدرت و بدون خش باشند
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    pcm = (mix * 32767).astype(np.int16)
    with wave.open("/tmp/mix.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", video_in, "-i", "/tmp/mix.wav", "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", video_out],
        check=True,
    )
    print("audio mixed ->", video_out)


main()
