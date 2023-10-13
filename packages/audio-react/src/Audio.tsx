import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import type { AudioAnnotationInUI, MediaAnnotatorRef, PlayerControllerRef } from '@labelu/components-react';
import type {
  Attribute,
  AudioAnnotationType,
  AudioFrameName,
  AudioFrameToolConfig,
  AudioSegmentName,
  AudioSegmentToolConfig,
  EnumerableAttribute,
} from '@labelu/interface';
import { AttributeOverlay, MediaAnnotationContext, MediaAnnotator, PlayerController } from '@labelu/components-react';

import { AudioPlayer } from './AudioPlayer';

const AudioAnnotatorWrapper = styled.div`
  background-color: #f8f8f8;
  position: relative;
`;

export interface AudioAnnotatorProps {
  className?: string;
  src: string;
  playerHeight?: number;
  selectedAnnotation?: AudioAnnotationInUI;
  playerRef: React.RefObject<WaveSurfer>;
  annotatorRef?: React.RefObject<MediaAnnotatorRef>;
  editingType?: AudioAnnotationType;
  showOrder?: boolean;
  editingLabel?: string;
  annotations: AudioAnnotationInUI[];
  disabled?: boolean;
  toolConfig?: {
    segment?: AudioSegmentToolConfig;
    frame?: AudioFrameToolConfig;
  };
  onLoad?: () => void;
  onAnnotationSelect?: (annotation: AudioAnnotationInUI) => void;
  onChange?: (annotations: AudioAnnotationInUI) => void;
  onAdd?: (annotations: AudioAnnotationInUI) => void;
  onAnnotateEnd?: (annotation: AudioAnnotationInUI, e?: MouseEvent) => void;
}

export const AudioAnnotator = forwardRef<HTMLDivElement, AudioAnnotatorProps>(function ForwardAudioAnnotator(
  {
    src,
    className,
    playerHeight = 322,
    editingType,
    onChange,
    playerRef: propsPlayerRef,
    annotatorRef: propsAnnotatorRef,
    onLoad,
    showOrder,
    editingLabel,
    onAdd,
    onAnnotateEnd,
    disabled,
    onAnnotationSelect,
    toolConfig,
    annotations,
    selectedAnnotation: propsSelectedAnnotation,
  },
  ref,
) {
  const playerRef = useRef<WaveSurfer>(null);
  const annotatorRef = useRef<MediaAnnotatorRef>(null);
  const [duration, setDuration] = useState(0);
  const controllerRef = useRef<PlayerControllerRef>(null);
  const [playingAnnotationIds, setPlayingAnnotationIds] = useState<string[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AudioAnnotationInUI | undefined>();

  const attributeConfigMapping = useMemo(() => {
    const mapping: Record<AudioSegmentName | AudioFrameName, Record<string, Attribute>> = {
      segment: {},
      frame: {},
    };

    if (!toolConfig) {
      return mapping;
    }

    Object.keys(toolConfig).forEach((key) => {
      const _key = key as AudioSegmentName | AudioFrameName;
      const _attributes: Attribute[] = toolConfig?.[_key]?.attributes ?? [];
      const _mapping: Record<string, Attribute> = {};

      _attributes.forEach((_item) => {
        _mapping[_item.value] = { ..._item };

        const _innerMapping: Record<string, any> = {};

        _item.attributes?.forEach((item) => {
          const newItem = {
            ...item,
            optionMapping: {},
          };

          const attributeWithOptions = item as EnumerableAttribute;

          if (item.type !== 'string') {
            newItem.optionMapping =
              attributeWithOptions.options?.reduce((acc1, cur2) => {
                acc1[cur2.value] = cur2;
                return acc1;
              }, {} as Record<string, any>) ?? {};
          }

          _innerMapping[item.value] = newItem;
        });
        // @ts-ignore
        _mapping[_item.value].attributesMapping = _innerMapping;
      });

      mapping[_key] = _mapping;
    });

    return mapping;
  }, [toolConfig]);

  const setCurrentAnnotationIds = useCallback(
    (time: number) => {
      if (!playerRef.current) {
        return;
      }

      const playingIds = annotations
        .filter((item) => {
          if (item.type === 'frame') {
            return item.time === time;
          }

          return item.start <= time && item.end >= time;
        })
        .map((item) => item.id);

      setPlayingAnnotationIds((pre) => {
        if (pre.join(',') === playingIds.join(',')) {
          return pre;
        }

        return playingIds;
      });
    },
    [annotations],
  );

  const handleOnPlaying = useCallback(
    (time: number) => {
      annotatorRef.current?.playing(time);
      setCurrentAnnotationIds(time);
    },
    [setCurrentAnnotationIds],
  );

  const handleOnLoad = useCallback(() => {
    if (!playerRef.current) {
      return;
    }
    const onPlay = () => {
      controllerRef.current?.play();
    };

    const onPause = () => {
      controllerRef.current?.pause();
    };

    const onTimeUpdate = (time: number) => {
      controllerRef.current?.updateTime(time);
      annotatorRef.current?.updateTime(time);
    };

    setDuration(playerRef.current.getDuration());

    playerRef.current.un('play', onPlay);
    playerRef.current.un('pause', onPause);
    playerRef.current.un('timeupdate', onTimeUpdate);

    playerRef.current.on('play', onPlay);
    playerRef.current.on('pause', onPause);
    playerRef.current.on('timeupdate', onTimeUpdate);
  }, []);

  const onPlayClick = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    playerRef.current?.setTime(time);
  }, []);

  const handleAnnotationSelect = useCallback(
    (_annotation: AudioAnnotationInUI) => {
      setSelectedAnnotation(_annotation);
      setCurrentAnnotationIds(_annotation.type === 'frame' ? _annotation.time : _annotation.start);
      onAnnotationSelect?.(_annotation);
    },
    [onAnnotationSelect, setCurrentAnnotationIds],
  );

  const handleAnnotationChange = useCallback(
    (_annotation: AudioAnnotationInUI) => {
      onChange?.(_annotation);
      annotatorRef.current?.scrollToAnnotation(_annotation);
    },
    [onChange],
  );

  const finishAnnotation = useCallback(
    (_annotation: AudioAnnotationInUI, e?: MouseEvent) => {
      onAdd?.(_annotation);
      onAnnotateEnd?.(_annotation, e);
      setSelectedAnnotation(_annotation);
      annotatorRef.current?.scrollToAnnotation(_annotation);
    },
    [onAdd, onAnnotateEnd],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(propsPlayerRef, () => playerRef.current!, [playerRef, duration]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(propsAnnotatorRef, () => annotatorRef.current!, [annotatorRef, duration]);

  useEffect(() => {
    setSelectedAnnotation(propsSelectedAnnotation);
  }, [propsSelectedAnnotation]);

  useEffect(() => {
    setSelectedAnnotation(undefined);
  }, [editingType]);

  // 选中时间点后，更新在时间区间内的标注
  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    const onTimeUpdate = (time: number) => {
      setCurrentAnnotationIds(time);
    };

    playerRef.current.un('timeupdate', onTimeUpdate);
    playerRef.current.on('timeupdate', onTimeUpdate);
  }, [duration, setCurrentAnnotationIds]);

  // ================== 快捷键 ==================
  // 快进10s
  useHotkeys(
    'ArrowRight',
    () => {
      if (playerRef.current) {
        playerRef.current.setTime(playerRef.current?.getCurrentTime() + 10);
      }
    },
    {
      enabled: !disabled,
      preventDefault: true,
    },
    [finishAnnotation, editingLabel, editingType],
  );

  // 后退10s
  useHotkeys(
    'ArrowLeft',
    () => {
      if (playerRef.current) {
        playerRef.current.setTime(playerRef.current?.getCurrentTime() - 10);
      }
    },
    {
      enabled: !disabled,
      preventDefault: true,
    },
    [finishAnnotation, editingLabel, editingType],
  );

  const contextValue = useMemo(() => {
    return {
      duration,
      setCurrentTime,
      getCurrentTime,
      onChange,
      annotations,
      selectedAnnotation,
      selectAnnotation: handleAnnotationSelect,
      onAnnotationChange: handleAnnotationChange,
      attributeConfigMapping,
      playingAnnotationIds,
      showOrder: Boolean(showOrder),
    };
  }, [
    duration,
    setCurrentTime,
    getCurrentTime,
    onChange,
    annotations,
    selectedAnnotation,
    handleAnnotationSelect,
    handleAnnotationChange,
    attributeConfigMapping,
    playingAnnotationIds,
    showOrder,
  ]);

  const onMediaLoad = useCallback(() => {
    handleOnLoad();
    onLoad?.();
  }, [onLoad, handleOnLoad]);

  return (
    <MediaAnnotationContext.Provider value={contextValue}>
      <AudioAnnotatorWrapper ref={ref} className={className}>
        <AudioPlayer ref={playerRef} src={src} height={playerHeight} onload={onMediaLoad} />
        <AttributeOverlay />
        <MediaAnnotator
          duration={duration}
          getCurrentTime={getCurrentTime}
          updateCurrentTime={setCurrentTime}
          annotations={annotations}
          ref={annotatorRef}
          onEnd={finishAnnotation}
          onAnnotationSelect={onAnnotationSelect}
          label={editingLabel}
          type={editingType}
        />
        <PlayerController
          ref={controllerRef}
          duration={duration}
          type="audio"
          onChange={onPlayClick}
          onPlaying={handleOnPlaying}
          getCurrentTime={getCurrentTime}
          onRateChange={(rate) => playerRef.current?.setPlaybackRate(rate, true)}
        />
      </AudioAnnotatorWrapper>
    </MediaAnnotationContext.Provider>
  );
});
