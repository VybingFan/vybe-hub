/** Generate a real, separate WAV preview so preview listeners never receive the full MP3. */
export async function generateWavPreview(
  source: File,
  startSec: number,
  durationSec: number,
): Promise<File> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await source.arrayBuffer());
    const startFrame = Math.max(0, Math.floor(startSec * decoded.sampleRate));
    const frameCount = Math.min(
      Math.floor(durationSec * decoded.sampleRate),
      Math.max(0, decoded.length - startFrame),
    );
    if (!frameCount) throw new Error("The selected preview start is beyond the song duration.");
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, channel) =>
      decoded.getChannelData(channel).slice(startFrame, startFrame + frameCount),
    );
    const wav = encodeWav(channels, decoded.sampleRate);
    return new File([wav], `${source.name.replace(/\.[^.]+$/, "")}-preview.wav`, {
      type: "audio/wav",
    });
  } finally {
    await context.close();
  }
}

function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  const channelCount = channels.length;
  const frameCount = channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + frameCount * channelCount * bytesPerSample);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + frameCount * channelCount * bytesPerSample, true);
  text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, frameCount * channelCount * bytesPerSample, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}
