// src/App.tsx
import { useEffect, useRef, useState } from 'react';
import AudioEngine from './audio/audioEngine';
import Pad from './components/Pad';

const PADS = 12;

function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [sampleNames, setSampleNames] = useState<Array<string | null>>(Array(PADS).fill(null));
  const [midiMap, setMidiMap] = useState<Array<number | null>>(Array(PADS).fill(null));
  const [learningPad, setLearningPad] = useState<number | null>(null);
  const midiAccessRef = useRef<any>(null);

  useEffect(() => {
    engineRef.current = new AudioEngine();

    async function initMIDI() {
      if (!(navigator as any).requestMIDIAccess) return;
      try {
        const access = await (navigator as any).requestMIDIAccess();
        midiAccessRef.current = access;
        const onMessage = (e: any) => {
          const [status, note, velocity] = e.data;
          const cmd = status & 0xf0;
          // Note on
          if (cmd === 0x90 && velocity > 0) {
            if (learningPad != null) {
              // map this note to the pad
              setMidiMap((prev) => {
                const next = prev.slice();
                // remove this note from any other pad
                for (let i = 0; i < next.length; i++) if (next[i] === note) next[i] = null;
                next[learningPad] = note;
                return next;
              });
              setLearningPad(null);
            } else {
              // find mapped pad
              const pad = midiMap.findIndex((n) => n === note);
              if (pad >= 0) engineRef.current?.play(pad);
            }
          }
        };

        const inputs = access.inputs.values();
        for (const input of inputs as any) {
          // addEventListener may not exist in some polyfills; use onmidimessage
          try {
            input.onmidimessage = onMessage;
          } catch (e) {
            input.addEventListener('midimessage', onMessage);
          }
        }
      } catch (err) {
        console.warn('MIDI init failed', err);
      }
    }

    initMIDI();
  }, []);

  useEffect(() => {
    // keep pad count in engine
    engineRef.current?.ensurePadCount(PADS);
  }, []);

  async function handleDropFile(index: number, file: File) {
    try {
      await engineRef.current?.loadFromFile(index, file);
      setSampleNames((prev) => {
        const next = prev.slice();
        next[index] = file.name;
        return next;
      });
    } catch (err) {
      console.error('Failed to load sample', err);
    }
  }

  async function handleTrigger(index: number) {
    // resume audio context if needed
    await engineRef.current?.resume();
    engineRef.current?.play(index);
  }

  function handleStartLearn(index: number) {
    setLearningPad((p) => (p === index ? null : index));
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', color: '#eee', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Dirty 12 — Drum Pad</h1>
        <div style={{ color: '#9aa' }}>Drop audio files onto pads. Connect a MIDI pad and press a pad to assign.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 640 }}>
        {Array.from({ length: PADS }).map((_, i) => (
          <Pad
            key={i}
            index={i}
            label={`Pad ${i + 1}`}
            sampleName={sampleNames[i]}
            midiNote={midiMap[i] ?? null}
            isLearning={learningPad === i}
            onDropFile={handleDropFile}
            onTrigger={handleTrigger}
            onStartLearn={handleStartLearn}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, color: '#bbc' }}>
        <div>How to use:</div>
        <ul>
          <li>Drag an audio file (wav, mp3, etc.) from your file manager onto a pad to assign it.</li>
          <li>Click a pad to trigger it. First click will resume audio context if needed.</li>
          <li>Click "Assign MIDI" on a pad, then press a key/pad on your MIDI controller to map it.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
