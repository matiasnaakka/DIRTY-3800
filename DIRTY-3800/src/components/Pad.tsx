import React from 'react';

type Props = {
  index: number;
  label?: string;
  sampleName?: string | null;
  midiNote?: number | null;
  isLearning?: boolean;
  onDropFile: (index: number, file: File) => void;
  onTrigger: (index: number) => void;
  onStartLearn: (index: number) => void;
};

export default function Pad({
  index,
  label,
  sampleName,
  midiNote,
  isLearning,
  onDropFile,
  onTrigger,
  onStartLearn,
}: Props) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onDropFile(index, f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        width: 140,
        height: 120,
        borderRadius: 8,
        background: '#1a1a1a',
        border: '2px solid #333',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        padding: 8,
        boxSizing: 'border-box',
        cursor: 'pointer',
      }}
      onClick={() => onTrigger(index)}
      title="Click to trigger — drop an audio file to assign"
    >
      <div style={{ fontSize: 12, color: '#bbb' }}>{label ?? `Pad ${index + 1}`}</div>
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#fff' }}>{sampleName ?? 'Drop sample'}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartLearn(index);
          }}
          style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: isLearning ? '#3a8' : '#222', color: '#fff', border: 'none' }}
        >
          {isLearning ? 'Waiting...' : 'Assign MIDI'}
        </button>
        <div style={{ minWidth: 56, textAlign: 'right', color: '#9ec', fontSize: 12 }}>
          {midiNote != null ? `MIDI ${midiNote}` : ''}
        </div>
      </div>
    </div>
  );
}
