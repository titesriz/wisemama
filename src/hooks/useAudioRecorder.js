import { useMemo, useRef, useState } from 'react';

const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  for (const mime of mimeCandidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const mimeType = useMemo(() => pickMimeType(), []);

  const stopTracks = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setError('');
    setRecordedBlob(null);
    setDurationMs(0);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Enregistrement non disponible sur ce navigateur.');
      return false;
    }

    if (typeof MediaRecorder === 'undefined') {
      setError('MediaRecorder non disponible sur ce navigateur.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Erreur pendant l enregistrement.');
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setRecordedBlob(blob);
        setDurationMs(Math.max(0, Date.now() - startedAtRef.current));
        setIsRecording(false);
        stopTracks();
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      return true;
    } catch {
      stopTracks();
      setIsRecording(false);
      setError('Micro non autorise ou indisponible.');
      return false;
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  };

  return {
    isRecording,
    recordedBlob,
    durationMs,
    error,
    mimeType,
    start,
    stop,
    clear: () => {
      setRecordedBlob(null);
      setDurationMs(0);
      setError('');
    },
  };
}
