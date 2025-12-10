import { useRef, useState } from "react";

export default function usePcmRecorder() {
  const [recording, setRecording] = useState(false);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const pcmDataRef = useRef([]);

  async function startRecording() {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    const source = audioContextRef.current.createMediaStreamSource(
      streamRef.current
    );

    processorRef.current = audioContextRef.current.createScriptProcessor(
      4096,
      1,
      1
    );
    processorRef.current.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      pcmDataRef.current.push(new Float32Array(input));
    };

    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);

    setRecording(true);
  }

  function stopRecording() {
    return new Promise((resolve) => {
      processorRef.current.disconnect();
      streamRef.current.getTracks().forEach((t) => t.stop());
      setRecording(false);

      // Merge PCM chunks
      const pcm = mergeBuffers(pcmDataRef.current);
      pcmDataRef.current = [];

      const wav = encodeWav(pcm, 16000);
      resolve(wav);
    });
  }

  return { startRecording, stopRecording, recording };
}

function mergeBuffers(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}
