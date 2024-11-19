import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type {
  VideoAnnotationType,
  Attribute,
  VideoSegmentName,
  VideoFrameName,
  EnumerableAttribute,
  VideoAnnotationInUI,
} from '@labelu/interface';
import type { MediaAnnotatorProps, MediaAnnotatorRef } from '@labelu/components-react';
import { MediaAnnotator, MediaAnnotationContext, AttributeOverlay, parseTime } from '@labelu/components-react';

import { VideoPlayer } from './VideoPlayer';

export interface VideoProps {
  src: string;
  annotations: VideoAnnotationInUI[];
  selectedAnnotation?: VideoAnnotationInUI;
  toolConfig?: {
    segment?: Attribute[];
    frame?: Attribute[];
  };
  editingType?: VideoAnnotationType;
  editingLabel?: string;
  annotatorRef?: React.RefObject<MediaAnnotatorRef>;
  disabled?: boolean;
  showOrder?: boolean;
  playerRef?: React.RefObject<any>;
  onChange?: (annotations: VideoAnnotationInUI) => void;
  onAdd?: (annotations: VideoAnnotationInUI) => void;
  onAnnotationSelect?: (annotation: VideoAnnotationInUI) => void;
  onAnnotateEnd?: (annotation: VideoAnnotationInUI, e?: MouseEvent) => void;
  requestEdit?: MediaAnnotatorProps['requestEdit'];
  className?: string;
}

const VideoAnnotator = forwardRef<HTMLDivElement | null, VideoProps>(function ForwardRefVideo(
  {
    src,
    annotations,
    toolConfig,
    editingType,
    playerRef: propsPlayerRef,
    annotatorRef: propsAnnotatorRef,
    editingLabel,
    onChange,
    onAnnotationSelect,
    selectedAnnotation: propsSelectedAnnotation,
    onAnnotateEnd,
    onAdd,
    requestEdit,
    showOrder = true,
    disabled,
    className,
  },
  ref,
) {
  const [duration, setDuration] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotationInUI | undefined>(
    propsSelectedAnnotation,
  );
  const editTypeRef = useRef<VideoAnnotationType | undefined>(editingType);
  const playerRef = useRef<any>(null);
  const annotatorRef = useRef<MediaAnnotatorRef | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const [playingAnnotationIds, setPlayingAnnotationIds] = useState<string[]>([]);

  useEffect(() => {
    if (editTypeRef.current !== editingType) {
      editTypeRef.current = editingType;
      setSelectedAnnotation(undefined);
    }
  }, [editingType]);

  useEffect(() => {
    setSelectedAnnotation(propsSelectedAnnotation);
  }, [propsSelectedAnnotation]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, [src]);

  useImperativeHandle(
    propsPlayerRef,
    () => {
      return playerRef.current;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [duration],
  );

  const finishAnnotation = useCallback(
    (_annotation: VideoAnnotationInUI, e?: MouseEvent) => {
      onAdd?.(_annotation);
      onAnnotateEnd?.(_annotation, e);
      setSelectedAnnotation(_annotation);
      annotatorRef.current?.scrollToAnnotation(_annotation);
    },
    [onAdd, onAnnotateEnd],
  );

  const handlePlayStatusChange = useCallback((isPlaying: boolean) => {
    isPlayingRef.current = isPlaying;
  }, []);

  const setCurrentAnnotationIds = useCallback(
    (time: number) => {
      if (!playerRef.current) {
        return;
      }

      const playingIds = annotations
        .filter((item) => {
          if (item.type === 'frame') {
            // 播放时播放器的时间不一定跟标注的时间一致，取一位小数再比较
            return parseTime(item.time) === parseTime(time);
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

  const handlePlaying = useCallback(
    (time: number) => {
      annotatorRef.current?.playing(time);
      setCurrentAnnotationIds(time);
    },
    [setCurrentAnnotationIds],
  );

  const handleAnnotationSelect = useCallback(
    (_annotation: VideoAnnotationInUI) => {
      setSelectedAnnotation(_annotation);
      setCurrentAnnotationIds(_annotation.type === 'frame' ? _annotation.time : _annotation.start);
      onAnnotationSelect?.(_annotation);

      if (playerRef.current) {
        playerRef.current.currentTime(_annotation.type === 'segment' ? _annotation.start : _annotation.time);
      }

      if (annotatorRef.current) {
        annotatorRef.current?.scrollToAnnotation(_annotation);
        annotatorRef.current?.updateTime(_annotation.type === 'segment' ? _annotation.start : _annotation.time);
      }
    },
    [onAnnotationSelect, setCurrentAnnotationIds],
  );

  const handleAnnotationChange = useCallback(
    (_annotation: VideoAnnotationInUI) => {
      onChange?.(_annotation);
      annotatorRef.current?.scrollToAnnotation(_annotation);
    },
    [onChange],
  );

  const updateCurrentTime = useCallback(
    (time: number) => {
      playerRef.current?.currentTime(time);
      setCurrentAnnotationIds(time);
    },
    [setCurrentAnnotationIds],
  );

  // ================== 快捷键 ==================
  // 快进10s
  useHotkeys(
    'ArrowRight',
    () => {
      if (playerRef.current) {
        playerRef.current.currentTime(playerRef.current.currentTime() + 10);
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
        playerRef.current.currentTime(playerRef.current.currentTime() - 10);
      }
    },
    {
      enabled: !disabled,
      preventDefault: true,
    },
    [finishAnnotation, editingLabel, editingType],
  );

  const attributeConfigMapping = useMemo(() => {
    const mapping: Record<VideoSegmentName | VideoFrameName, Record<string, Attribute>> = {
      segment: {},
      frame: {},
    };

    if (!toolConfig) {
      return mapping;
    }

    Object.keys(toolConfig).forEach((key) => {
      const _key = key as VideoSegmentName | VideoFrameName;
      const _attributes: Attribute[] = toolConfig?.[_key] ?? [];
      const _mapping: Record<
        string,
        Attribute & {
          attributesMapping?: Record<string, Attribute>;
        }
      > = {};

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(propsAnnotatorRef, () => annotatorRef.current!, [annotatorRef, duration]);

  // 选中时间点后，更新在时间区间内的标注
  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    const onTimeUpdate = () => {
      setCurrentAnnotationIds(playerRef.current?.currentTime());
    };

    playerRef.current.off('timeupdate', onTimeUpdate);
    playerRef.current.on('timeupdate', onTimeUpdate);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      playerRef.current?.off('timeupdate', onTimeUpdate);
    };
  }, [duration, setCurrentAnnotationIds]);

  const contextValue = useMemo(() => {
    return {
      duration,
      playerRef,
      onChange,
      annotations,
      selectedAnnotation,
      selectAnnotation: handleAnnotationSelect,
      onAnnotationChange: handleAnnotationChange,
      attributeConfigMapping,
      requestEdit,
      playingAnnotationIds,
      showOrder,
      setCurrentTime: (time: number) => playerRef.current?.currentTime(time),
      getCurrentTime: () => playerRef.current.currentTime(),
    };
  }, [
    duration,
    handleAnnotationChange,
    handleAnnotationSelect,
    onChange,
    showOrder,
    requestEdit,
    annotations,
    selectedAnnotation,
    attributeConfigMapping,
    playingAnnotationIds,
  ]);

  return (
    <MediaAnnotationContext.Provider value={contextValue}>
      <VideoPlayer
        src={src}
        className={className}
        ref={playerRef}
        wrapperRef={ref}
        onStatusChange={handlePlayStatusChange}
        onMetaDataLoad={(videoElement) => setDuration(videoElement.duration)}
        onPlaying={handlePlaying}
      >
        <AttributeOverlay />
        <MediaAnnotator
          disabled={disabled}
          annotations={annotations}
          duration={duration}
          type={editingType}
          label={editingLabel}
          getCurrentTime={() => playerRef.current.currentTime()}
          updateCurrentTime={updateCurrentTime}
          onEnd={finishAnnotation}
          ref={annotatorRef}
        />
      </VideoPlayer>
    </MediaAnnotationContext.Provider>
  );
});

export default VideoAnnotator;
