import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const levelRafRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const mimeType = useMemo(() => pickMimeType(), []);

  const stopMeters = () => {
    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const stopTracks = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopMeters();
      stopTracks();
    };
  }, []);

  const startMeters = (stream) => {
    try {
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          sum += data[i];
        }
        const avg = sum / data.length;
        setAudioLevel(Math.min(1, avg / 128));
        levelRafRef.current = requestAnimationFrame(loop);
      };
      levelRafRef.current = requestAnimationFrame(loop);
    } catch {
      setAudioLevel(0);
    }

    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startedAtRef.current));
    }, 100);
  };

  const start = async () => {
    setError('');
    setRecordedBlob(null);
    setDurationMs(0);
    setElapsedMs(0);

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
      startMeters(stream);

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
        const finalDuration = Math.max(0, Date.now() - startedAtRef.current);
        setRecordedBlob(blob);
        setDurationMs(finalDuration);
        setElapsedMs(finalDuration);
        setIsRecording(false);
        stopMeters();
        stopTracks();
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      return true;
    } catch {
      stopMeters();
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
    elapsedMs,
    audioLevel,
    error,
    mimeType,
    start,
    stop,
    clear: () => {
      stopMeters();
      setRecordedBlob(null);
      setDurationMs(0);
      setElapsedMs(0);
      setAudioLevel(0);
      setError('');
    },
  };
}
