let audioContext: AudioContext | null = null;

export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    audioContext ??= new AudioContext();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    gain.connect(audioContext.destination);
    [660, 880].forEach((frequency, index) => {
      const oscillator = audioContext!.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + 0.32 + index * 0.11);
    });
  } catch {
    // The visual notification remains available if a browser blocks audio.
  }
}
