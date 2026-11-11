"""Jingle « chill » GJM AUTO (16 s, 88 BPM, ambiance lo-fi / chillhop), entièrement synthétisé : libre de droits.
Usage : python3 tools/make-jingle-chill.py brand/audio/jingle-gjm-auto-chill.wav
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
BPM = 88
BEAT = 60 / BPM
DUR = 16.0
N = int(SR * DUR)
rng = np.random.default_rng(33)
L = np.zeros(N); R = np.zeros(N)


def env(n, a=0.002, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * t / d)


def filt(x, f, kind='low', order=2):
    b, a = butter(order, (np.array(f) if np.ndim(f) else f) / (SR / 2), btype=kind)
    return lfilter(b, a, x)


def add(sig, t0, gain=1.0, pan=0.0, buf=None):
    i = int(t0 * SR)
    if i >= N:
        return
    s = sig[: N - i] * gain
    (buf or (L, R))[0][i:i + len(s)] += s * (1 - max(0, pan))
    (buf or (L, R))[1][i:i + len(s)] += s * (1 + min(0, pan))


def kick():
    n = int(SR * 0.5); t = np.arange(n) / SR
    f = 48 + 60 * np.exp(-t * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.35, 3.2)


def rim():
    n = int(SR * 0.12); t = np.arange(n) / SR
    return (filt(rng.standard_normal(n), [1800, 5200], 'band') * 0.6 + np.sin(2 * np.pi * 820 * t) * 0.5) * env(n, 0.001, 0.05, 4)


def snap():
    n = int(SR * 0.2)
    return filt(rng.standard_normal(n), [1200, 4500], 'band') * env(n, 0.001, 0.1, 4)


def hat(soft=1.0):
    n = int(SR * 0.06)
    return filt(rng.standard_normal(n), 8000, 'high') * env(n, 0.001, 0.035, 4) * soft


def keys(freqs, len_s):
    """Piano électrique doux (type Rhodes) : partiels + trémolo léger."""
    n = int(SR * len_s); t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for k, (m, g) in enumerate(((1, 1.0), (2, 0.28), (3, 0.08), (4.01, 0.05))):
            s += g * np.sin(2 * np.pi * f * m * (1 + 0.0015 * (k % 2)) * t) * np.exp(-t * (1.1 + 0.9 * k))
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    e = np.minimum(1, t / 0.008) * np.minimum(1, (len_s - t) / 0.12).clip(0)
    return filt(s * trem * e, 3800)


def bass(f, len_s):
    n = int(SR * len_s); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / 0.02) * np.minimum(1, (len_s - t) / 0.08).clip(0) * np.exp(-t * 0.6)


def pad(freqs, len_s):
    n = int(SR * len_s); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.004 * t) for f in freqs)
    return filt(s, 1500) * np.minimum(1, t / 1.2) * np.minimum(1, (len_s - t) / 0.8).clip(0)


# Progression jazzy douce : Fmaj7 – Em7 – Dm9 – Cmaj7
C = {'Fmaj7': (43.65, [174.6, 220.0, 261.6, 329.6]), 'Em7': (41.2, [164.8, 196.0, 246.9, 293.7]),
     'Dm9': (36.7, [146.8, 174.6, 220.0, 329.6]), 'Cmaj7': (32.7, [130.8, 164.8, 196.0, 246.9])}
order = ['Fmaj7', 'Em7', 'Dm9', 'Cmaj7']
BAR = 4 * BEAT                     # ≈ 2,73 s
swing = 0.06 * BEAT

wet = (np.zeros(N), np.zeros(N))   # bus réverbération (claviers)
add(pad(C['Fmaj7'][1], 1.6), 0.0, 0.10)
t0 = 0.6
for b in range(6):
    bt = t0 + b * BAR
    if bt >= 15.2:
        break
    root, chord = C[order[b % 4]]
    # claviers : accord posé + rappel syncopé
    add(keys(chord, BAR * 0.9), bt, 0.16, -0.15); add(keys(chord, BAR * 0.9), bt, 0.10, buf=wet)
    add(keys(chord[1:], BEAT * 1.2), bt + 2.5 * BEAT, 0.10, 0.2); add(keys(chord[1:], BEAT * 1.2), bt + 2.5 * BEAT, 0.07, buf=wet)
    # basse
    add(bass(root * 2, BEAT * 1.6), bt, 0.36)
    add(bass(root * 3, BEAT * 0.9), bt + 2.5 * BEAT, 0.22)
    if b >= 1:  # la batterie entre à la 2e mesure
        add(kick(), bt, 0.7); add(kick(), bt + 2.5 * BEAT, 0.55)
        add(snap(), bt + BEAT, 0.28); add(snap(), bt + 3 * BEAT, 0.28)
        add(rim(), bt + 3.75 * BEAT, 0.12)
        for k in range(8):
            add(hat(0.9 if k % 2 == 0 else 0.55), bt + k * BEAT / 2 + (swing if k % 2 else 0), 0.10, 0.25)

# fin : accord final qui résonne, sous le prix
add(keys(C['Fmaj7'][1] + [440.0], 1.2), 15.0, 0.18); add(keys(C['Fmaj7'][1], 1.0), 15.0, 0.12, buf=wet)
add(bass(C['Fmaj7'][0] * 2, 1.0), 15.0, 0.3)

# réverbération simple (réponse impulsionnelle exponentielle)
ir_n = int(SR * 1.6); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 3.2)
ir = filt(ir, 4000) * 0.03
L += fftconvolve(wet[0], ir)[:N]; R += fftconvolve(wet[1], ir[::-1].copy() if False else ir)[:N]
# léger souffle « vinyle »
crackle = filt(rng.standard_normal(N), [1500, 6000], 'band') * 0.004
L += crackle; R += crackle

mix = np.stack([filt(L, 9000), filt(R, 9000)], axis=1)
mix = np.tanh(1.05 * mix / (np.max(np.abs(mix)) + 1e-9)) * 0.85
fade = int(0.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'jingle-chill.wav', SR, (mix * 32767).astype(np.int16))
print('OK')
