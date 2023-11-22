import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { WaveSurferOptions } from 'wavesurfer.js';
import WaveSurfer from 'wavesurfer.js';

export const useWaveSurfer = (
  containerRef: React.RefObject<HTMLDivElement>,
  options: Omit<WaveSurferOptions, 'container'>,
) => {
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ws = WaveSurfer.create({
      ...options,
      container: containerRef.current,
    });

    setWaveSurfer(ws);

    return () => {
      setWaveSurfer(null);
      ws.destroy();
    };
  }, [options, containerRef]);

  return waveSurfer;
};

const WaveWrapper = styled.div`
  background-color: #000;
`;

export interface AudioPlayerProps {
  src: string;
  height: number;
  onload?: () => void;
}

export const AudioPlayer = forwardRef<WaveSurfer | null, AudioPlayerProps>(function ForwardRefAudioPlayer(
  { onload, src, height },
  ref,
) {
  const audioRef = useRef<HTMLDivElement>(null);
  const options = useMemo<Omit<WaveSurferOptions, 'container' | 'url'>>(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    const ratio = window.devicePixelRatio || 1;

    const waveGradient = ctx!.createLinearGradient(0, 0, 0, ratio * height);

    const waveTopColor = '#26b5b2';
    const waveBottomColor = '#02929f';

    const progressTopColor = '#32FFFC';
    const progressBottomColor = '#00E9FF';

    waveGradient.addColorStop(0, waveTopColor);
    waveGradient.addColorStop(0.3, waveTopColor);
    waveGradient.addColorStop(0.5, waveBottomColor);
    waveGradient.addColorStop(0.7, waveTopColor);
    waveGradient.addColorStop(1, waveTopColor);

    const progressGradient = ctx!.createLinearGradient(0, 0, 0, ratio * height);

    progressGradient.addColorStop(0, progressTopColor);
    progressGradient.addColorStop(0.3, progressTopColor);
    progressGradient.addColorStop(0.5, progressBottomColor);
    progressGradient.addColorStop(0.7, progressTopColor);
    progressGradient.addColorStop(1, progressTopColor);

    return {
      waveColor: waveGradient,
      progressColor: progressGradient,
      height,
      barWidth: 3.5,
      barHeight: 0.5,
      barRadius: 3,
      barGap: 6,
      cursorColor: '#0d53de',
    };
  }, [height]);
  const waveSurfer = useWaveSurfer(audioRef, options);

  useImperativeHandle(ref, () => waveSurfer!, [waveSurfer]);

  useEffect(() => {
    waveSurfer?.load(src).then(() => {
      onload?.();
    });
  }, [onload, src, waveSurfer]);

  return <WaveWrapper ref={audioRef} />;
});
