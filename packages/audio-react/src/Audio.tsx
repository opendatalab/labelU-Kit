import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import type { MediaAnnotatorProps, MediaAnnotatorRef, PlayerControllerRef } from '@labelu/components-react';
import type {
  Attribute,
  AudioAnnotationType,
  AudioFrameName,
  AudioSegmentName,
  EnumerableAttribute,
  AudioAnnotationInUI,
} from '@labelu/interface';
import {
  AttributeOverlay,
  MediaAnnotationContext,
  MediaAnnotator,
  PlayerController,
  parseTime,
} from '@labelu/components-react';

import { AudioPlayer } from './AudioPlayer';

const AudioAnnotatorWrapper = styled.div`
  background-color: #f8f8f8;
  position: relative;
`;

const cachedRate = localStorage.getItem('labelu:audio-rate') ?? '1';

export interface AudioAnnotatorProps {
  className?: string;
  /** 音频文件url */
  src: string;
  /** 播放器高度 */
  playerHeight?: number;
  /** 选中的标注 */
  selectedAnnotation?: AudioAnnotationInUI;
  /** 播放器ref */
  playerRef: React.RefObject<WaveSurfer>;
  /** 标注器ref */
  annotatorRef?: React.RefObject<MediaAnnotatorRef>;
  /** 标注类型 */
  editingType?: AudioAnnotationType;
  /** 是否显示标注顺序 */
  showOrder?: boolean;
  /** 当前选中的标签属性 */
  editingLabel?: string;
  /** 标注列表 */
  annotations: AudioAnnotationInUI[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 标注工具配置 */
  toolConfig?: {
    segment?: Attribute[];
    frame?: Attribute[];
  };
  /** 文件加载完的回调 */
  onLoad?: () => void;
  /**
   * 标注选中的回调
   *
   * @param annotation 选中的标注
   */
  onAnnotationSelect?: (annotation: AudioAnnotationInUI, e: React.MouseEvent) => void;
  /**
   * 当标注改变时调用的回调
   *
   * @param annotations 标注列表，包含标注的可见性
   */
  onChange?: (annotations: AudioAnnotationInUI) => void;
  /**
   * 当新增标注时的回调
   *
   * @param annotations 标注列表，包含标注的可见性
   */
  onAdd?: (annotations: AudioAnnotationInUI) => void;
  /**
   * 标注结束时的回调
   *
   * @param annotation 标注
   * @param e 事件，需要根据鼠标事件中的位置来控制标签属性表单弹框的显示位置；当通过快捷键结束标注时，e为undefined，此时弹框显示在默认位置。
   */
  onAnnotateEnd?: (annotation: AudioAnnotationInUI, e?: MouseEvent) => void;

  requestEdit?: MediaAnnotatorProps['requestEdit'];
}

/**
 * 音频标注器
 *
 * @see [使用示例](https://github.com/opendatalab/labelU-Kit/tree/main/packages/audio-react/example)
 */
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
    requestEdit,
  },
  ref,
) {
  const playerRef = useRef<WaveSurfer>(null);
  const editTypeRef = useRef<AudioAnnotationType | undefined>(editingType);
  const annotatorRef = useRef<MediaAnnotatorRef>(null);
  const [duration, setDuration] = useState(0);
  const controllerRef = useRef<PlayerControllerRef>(null);
  const [playingAnnotationIds, setPlayingAnnotationIds] = useState<string[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AudioAnnotationInUI | undefined>();
  const [rate, setRate] = useState(Number(cachedRate));
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
      const _attributes: Attribute[] = toolConfig?.[_key] ?? [];
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

  const handleRateChange = useCallback((value: number) => {
    localStorage.setItem('labelu:audio-rate', value.toString());
    setRate(value);
    playerRef.current?.setPlaybackRate(value, true);
  }, []);

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

    playerRef.current?.setPlaybackRate(rate, true);

    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [rate]);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    playerRef.current?.setTime(time);
  }, []);

  const handleAnnotationSelect = useCallback(
    (_annotation: AudioAnnotationInUI, e: React.MouseEvent) => {
      setSelectedAnnotation(_annotation);
      setCurrentAnnotationIds(_annotation.type === 'frame' ? _annotation.time : _annotation.start);
      onAnnotationSelect?.(_annotation, e);

      if (playerRef.current) {
        playerRef.current.setTime(_annotation.type === 'frame' ? _annotation.time : _annotation.start);
      }

      if (annotatorRef) {
        annotatorRef.current?.scrollToAnnotation(_annotation);
        annotatorRef.current?.updateTime(_annotation.type === 'segment' ? _annotation.start : _annotation.time);
      }
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
    if (editTypeRef.current !== editingType) {
      editTypeRef.current = editingType;
      setSelectedAnnotation(undefined);
    }
  }, [editingType]);

  useEffect(() => {
    setSelectedAnnotation(propsSelectedAnnotation);
  }, [propsSelectedAnnotation]);

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
      requestEdit,
      disabled,
      showOrder: Boolean(showOrder),
    };
  }, [
    duration,
    setCurrentTime,
    getCurrentTime,
    onChange,
    annotations,
    requestEdit,
    selectedAnnotation,
    handleAnnotationSelect,
    handleAnnotationChange,
    attributeConfigMapping,
    playingAnnotationIds,
    showOrder,
    disabled,
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
          label={editingLabel}
          type={editingType}
        />
        <PlayerController
          ref={controllerRef}
          duration={duration}
          type="audio"
          rate={rate}
          onChange={onPlayClick}
          onPlaying={handleOnPlaying}
          getCurrentTime={getCurrentTime}
          onRateChange={handleRateChange}
        />
      </AudioAnnotatorWrapper>
    </MediaAnnotationContext.Provider>
  );
});

AudioAnnotator.displayName = 'AudioAnnotator';
