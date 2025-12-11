export function convertToWav(buffer, sampleRate = 44100) {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const numFrames = buffer.length;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + numFrames * bytesPerSample, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);

  writeString(view, 36, "data");
  view.setUint32(40, numFrames * bytesPerSample, true);

  const wavBuffer = new ArrayBuffer(44 + numFrames * bytesPerSample);
  const wavView = new DataView(wavBuffer);

  new Uint8Array(wavBuffer).set(new Uint8Array(wavHeader), 0);

  let offset = 44;
  for (let i = 0; i < numFrames; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    wavView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return wavBuffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
