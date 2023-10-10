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
    const waveGradient = ctx!.createLinearGradient(0, 0, 0, 644);

    const waveTopColor = 'rgba(0, 251, 255, 0.5)';
    const waveBottomColor = 'rgba(97, 7, 243, 0.5)';

    const progressTopColor = 'rgba(95, 252, 255, 1)';
    const progressBottomColor = 'rgba(97, 7, 243, 1)';

    waveGradient.addColorStop(0, waveTopColor);
    waveGradient.addColorStop(0.3, waveTopColor);
    waveGradient.addColorStop(0.5, waveBottomColor);
    waveGradient.addColorStop(0.7, waveTopColor);
    waveGradient.addColorStop(1, waveTopColor);

    const progressGradient = ctx!.createLinearGradient(0, 0, 0, 644);

    progressGradient.addColorStop(0, progressTopColor);
    progressGradient.addColorStop(0.3, progressTopColor);
    progressGradient.addColorStop(0.5, progressBottomColor);
    progressGradient.addColorStop(0.7, progressTopColor);
    progressGradient.addColorStop(1, progressTopColor);

    return {
      waveColor: waveGradient,
      progressColor: progressGradient,
      height,
      barWidth: 3,
      barGap: 2,
      barHeight: 1.5,
      cursorColor: 'rgba(27, 103, 255, 1)',
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
