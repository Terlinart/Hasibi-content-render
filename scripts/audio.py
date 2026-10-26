"""صدای ریلز: گویندهٔ فارسی (Edge TTS رایگان) + موزیک ساخته‌شده با کد + افکت روی هر برش.
موزیک با کد ساخته می‌شود، پس هیچ مشکل کپی‌رایتی ندارد و هر ویدیو (با seed) ریتم و آکورد خودش را دارد.
استفاده: python3 scripts/audio.py job.json out/reel_silent.mp4 out/reel.mp4
"""
import asyncio
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

# ---------- متن گوینده: از فیلدهای تأییدشده ساخته می‌شود، نه آزاد ----------
LAT = {"A": "اِی", "B": "بی", "C": "سی", "D": "دی", "E": "ای", "K": "کا", "Q": "کیو", "Z": "زد"}
NUM = {"1": "یک", "2": "دو", "3": "سه", "6": "شش", "7": "هفت", "9": "نه", "12": "دوازده"}


def speakable(t: str) -> str:
    import re

    t = re.sub(r"\b([A-Z])(\d{1,2})\b", lambda m: f"{LAT.get(m.group(1), m.group(1))} {NUM.get(m.group(2), m.group(2))}", t)
    return t


def voiceover_text(j: dict) -> str:
    ing = "، ".join(j["ingredients"][:4])
    return speakable(
        f"سلام کوه‌پایه! {j['hook']} "
        f"{j['productFa']}، {j['category']}. "
        f"روی جعبه‌اش نوشته: {j['boxClaim']}. "
        f"ترکیبات روی جعبه: {ing}. "
        f"برای مشاوره با دکتر حصیبی تماس بگیرید. داروخانه دکتر حصیبی، کرمان، کوهپایه."
    )


VOICES = ["fa-IR-DilaraNeural", "fa-IR-FaridNeural"]


async def tts(text: str, path: str):
    import edge_tts

    voice = VOICES[seed % len(VOICES)]
    await edge_tts.Communicate(text, voice, rate="+12%").save(path)


def load_wav_mono(path: str) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


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
    buf[p:e] += gain * clip[: e - p]


def main():
    total = TOTAL
    n = int(total * SR)
    mix = music(total)

    # گوینده
    voice = np.zeros(0, dtype=np.float32)
    try:
        asyncio.run(tts(job.get("voiceover") or voiceover_text(job), "/tmp/vo.mp3"))
        voice = load_wav_mono("/tmp/vo.mp3")
    except Exception as e:  # بدون اینترنت/سرویس: ویدیو بدون گوینده ساخته می‌شود
        print("TTS skipped:", e)
    if len(voice):
        max_len = (total - 1.0) * SR
        if len(voice) > max_len:  # اگر بلند بود کمی تندترش کن
            factor = len(voice) / max_len
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", "/tmp/vo.mp3", "-filter:a", f"atempo={min(factor, 1.6):.3f}", "/tmp/vo2.wav"],
                check=True,
            )
            voice = load_wav_mono("/tmp/vo2.wav")[: int(max_len)]
        voice = voice / (np.max(np.abs(voice)) + 1e-9) * 0.9
        # داکینگ: موزیک زیر صدا آرام شود
        vbuf = np.zeros(n, dtype=np.float32)
        place(vbuf, voice, 0.35, 1.0)
        envv = np.convolve(np.abs(vbuf), np.ones(4410) / 4410, mode="same")
        duck = 1 - 0.65 * np.clip(envv / 0.08, 0, 1)
        mix = mix * duck + vbuf

    # افکت‌ها: هر برش صحنه یک افکت متفاوت
    order = ["hook"] + [["glass", "neon", "poster"], ["neon", "glass", "poster"], ["glass", "poster", "neon"]][abs(seed) % 3] + ["outro"]
    t = 0.0
    place(mix, impact(), 0.0, 0.5)
    kinds = ["whoosh", "riser", "impact", "ding"]
    rng.shuffle(kinds)
    for i, k in enumerate(order[:-1]):
        t += SCENES[k] / FPS
        kind = kinds[i % len(kinds)]
        if kind == "whoosh":
            place(mix, whoosh(0.4, True), t - 0.3, 0.35)
        elif kind == "riser":
            place(mix, whoosh(0.8, True), t - 0.75, 0.3)
        elif kind == "impact":
            place(mix, impact(), t, 0.45)
        else:
            place(mix, ding(), t, 0.25)

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
    print("audio mixed ->", video_out, "| voice:", "yes" if len(voice) else "no")


main()
