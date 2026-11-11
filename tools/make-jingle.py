"""Jingle original GJM AUTO (16 s, 120 BPM, groove dembow / shatta), entièrement synthétisé : aucun échantillon externe,
donc libre de droits pour GJM AUTO.  Usage : python3 tools/make-jingle.py brand/audio/jingle-gjm-auto.wav
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
BPM = 120
BEAT = 60 / BPM            # 0,5 s
DUR = 16.0
N = int(SR * DUR)
rng = np.random.default_rng(974)
L = np.zeros(N); R = np.zeros(N)


def env(n, a=0.002, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * t / d)
    return e


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * (1 - max(0, pan))
    R[i:i + len(s)] += s * (1 + min(0, pan))


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype='band')
    return lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), btype='high')
    return lfilter(b, a, x)


def kick(len_s=0.45):
    n = int(SR * len_s); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * env(n, 0.001, 0.32, 3.5))


def snare(len_s=0.22):
    n = int(SR * len_s)
    noise = bp(rng.standard_normal(n), 1500, 7000) * env(n, 0.001, 0.12, 4)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.06, 4)
    return 0.8 * noise + 0.5 * tone


def clap(len_s=0.25):
    n = int(SR * len_s); out = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR); m = n - i
        out[i:] += bp(rng.standard_normal(m), 900, 5000) * env(m, 0.001, 0.05 if k < 2 else 0.16, 4)
    return out


def hat(len_s=0.05, open_=False):
    n = int(SR * (0.2 if open_ else len_s))
    return hp(rng.standard_normal(n), 7000) * env(n, 0.001, 0.15 if open_ else 0.03, 4)


def bass(freq, len_s):
    n = int(SR * len_s); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t)
    e = np.minimum(1, t / 0.005) * np.minimum(1, (len_s - t) / 0.03)
    return np.tanh(1.6 * s) * e


def stab(freqs, len_s=0.18):
    n = int(SR * len_s); t = np.arange(n) / SR
    s = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * 1.005 * t) for f in freqs)
    return bp(s, 300, 4500) * env(n, 0.003, 0.14, 3)


def riser(len_s=1.0):
    n = int(SR * len_s); t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 2000) * (t / len_s) ** 2
    f = 200 + 1800 * (t / len_s) ** 2
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / len_s) ** 2 * 0.3
    return noise * 0.5 + sweep


def impact(len_s=1.6):
    n = int(SR * len_s); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 10)) * t) * env(n, 0.001, 1.0, 3)
    crash = hp(rng.standard_normal(n), 4000) * env(n, 0.001, 1.2, 3) * 0.35
    return np.tanh(1.5 * boom) + crash


# Harmonie : La mineur – Fa – Sol – Mi mineur (2 s par accord = 1 mesure)
prog = [(55.0, [220, 261.6, 329.6]), (43.65, [174.6, 220, 261.6]), (49.0, [196, 246.9, 293.7]), (41.2, [164.8, 196, 246.9])]

add(riser(1.0), 0.0, 0.5)
t0 = 1.0                     # le groove démarre après la montée
bars = int((15.0 - t0) / (4 * BEAT))   # 7 mesures
for b in range(bars):
    bt = t0 + b * 4 * BEAT
    root, chord = prog[b % 4]
    for beat in range(4):
        tb = bt + beat * BEAT
        add(kick(), tb, 0.95)                                   # grosse caisse sur chaque temps (dembow)
        add(hat(), tb + BEAT / 2, 0.22, pan=0.3)                # charleston sur les contretemps
        add(hat(), tb + BEAT * 0.75, 0.12, pan=-0.3)
    # caisse claire dembow : « a » du 1, « et » du 2, « a » du 3, « et » du 4
    for off in (0.75, 1.5, 2.75, 3.5):
        add(snare(), bt + off * BEAT, 0.55)
    if b % 2 == 1:
        add(clap(), bt + 3 * BEAT, 0.5)
    # basse syncopée
    for off, ln, mult in ((0, 0.7, 1), (0.75, 0.25, 1), (1.5, 0.45, 2), (2.5, 0.4, 1), (3.25, 0.5, 1.5)):
        add(bass(root * mult, ln * BEAT * 2), bt + off * BEAT, 0.42)
    # accords en stabs sur les contretemps (entrent à la 2e mesure)
    if b >= 1:
        for off in (0.5, 1.5, 2.5, 3.0, 3.5):
            add(stab(chord), bt + off * BEAT, 0.16, pan=(0.25 if off % 1 else -0.25))
    if b == bars - 1:
        add(hat(open_=True), bt + 3.5 * BEAT, 0.3)

add(impact(1.0), 15.0, 0.9)
add(stab(prog[0][1], 0.8), 15.0, 0.25)

mix = np.stack([L, R], axis=1)
mix = np.tanh(1.2 * mix / (np.max(np.abs(mix)) + 1e-9)) * 0.89     # légère saturation, -1 dBFS environ
fade = int(0.05 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'jingle.wav', SR, (mix * 32767).astype(np.int16))
print('OK')
