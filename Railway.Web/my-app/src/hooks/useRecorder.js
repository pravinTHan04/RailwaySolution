import { useState, useRef } from "react";
import { convertToWav } from "../utils/convertToWav";

export default function useRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  }

  async function stopRecording() {
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });

        const wavBlob = await convertToWav(blob); // <<< IMPORTANT
        resolve(wavBlob);
      };

      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  }

  return { recording, startRecording, stopRecording };
}
