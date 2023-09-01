import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import type {
  VideoAnnotationType,
  VideoSegmentAnnotation,
  Attribute,
  VideoSegmentName,
  VideoFrameName,
  VideoSegmentToolConfig,
  VideoFrameToolConfig,
} from '@label-u/interface';

import VideoPlayer from './VideoPlayer';
import AnnotationBar, { AttributeItem } from './AnnotationBar';
import sliceIcon from './assets/icons/cursor-slice.svg';
import frameIcon from './assets/icons/cursor-frame.svg';
import { parseTime, scheduleVideoAnnotationLane, uid } from './utils';
import GlobalStyle from './GlobalStyle';
import type { VideoAnnotationInUI } from './context';
import VideoAnnotationContext from './context';
import { ReactComponent as ExpandIcon } from './assets/icons/arrow.svg';

const ExpandTrigger = styled.div<{ expanded: boolean }>`
  cursor: pointer;
  position: absolute;
  height: 1rem;
  width: 2rem;
  font-size: 12px;
  top: -1rem;
  border-radius: 2px 2px 0 0;
  background-color: #333;
  color: #999;
  border: solid 1px rgb(86 86 86);
  left: 50%;
  border-bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;

  .expand-icon {
    transform: rotate(${({ expanded }) => (expanded ? '0' : '180deg')});
  }
`;

const BarWrapper = styled.div<{ expanded?: boolean }>`
  position: relative;
  user-select: none;
  --bar-height: 2.5rem;

  .lane-wrapper {
    max-height: var(--bar-height);
    ${({ expanded }) =>
      expanded &&
      css`
        max-height: calc(5 * var(--bar-height));
      `}
    overflow: auto;
  }

  .player-frame {
    left: 0;
    position: absolute;
    height: 100%;
    width: 1px;
    top: 0;
    background-color: #fff;
    z-index: 999;
  }
`;

const ActivityBar = styled.div<{ editingType?: VideoAnnotationType }>`
  position: relative;
  background-color: #333;
  height: var(--bar-height);
  border-top: 1px solid #e6e6e633;
  ${({ editingType }) =>
    editingType === 'segment' &&
    css`
      cursor: url(${sliceIcon}) 10 10, auto;
    `}
  ${({ editingType }) =>
    editingType === 'frame' &&
    css`
      cursor: url(${frameIcon}) 10 10, auto;
    `}
`;

export interface VideoProps {
  src: string;
  annotations: VideoAnnotationInUI[];
  selectedAnnotation?: VideoAnnotationInUI;
  toolConfig?: {
    segment?: VideoSegmentToolConfig;
    frame?: VideoFrameToolConfig;
  };
  editingType?: VideoAnnotationType;
  editingLabel?: string;
  disabled?: boolean;
  showOrder?: boolean;
  playerRef?: React.RefObject<any>;
  onChange?: (annotations: VideoAnnotationInUI) => void;
  onAdd?: (annotations: VideoAnnotationInUI) => void;
  onAnnotationSelect?: (annotation: VideoAnnotationInUI) => void;
  onAnnotateEnd?: (annotation: VideoAnnotationInUI, e?: MouseEvent) => void;
  className?: string;
}

export default forwardRef<HTMLDivElement | null, VideoProps>(function Video(
  {
    src,
    annotations,
    toolConfig,
    editingType,
    playerRef: propsPlayerRef,
    editingLabel,
    onChange,
    onAnnotationSelect,
    selectedAnnotation: propsSelectedAnnotation,
    onAnnotateEnd,
    onAdd,
    showOrder = true,
    disabled,
    className,
  }: VideoProps,
  ref,
) {
  const [duration, setDuration] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotationInUI | undefined>();
  const [expanded, setExpanded] = useState<boolean>(false);
  const playerRef = useRef<any>(null);
  const laneRef = useRef<HTMLDivElement | null>(null);
  const editingElementRef = useRef<HTMLDivElement | null>(null);
  const editingSegmentAnnotationRef = useRef<VideoSegmentAnnotation | null>(null);
  const activityBarRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const isSettingCurrentTimeRef = useRef<boolean>(false);
  const [editingAnnotation, setEditingAnnotation] = useState<VideoSegmentAnnotation | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const [playingAnnotationIds, setPlayingAnnotationIds] = useState<string[]>([]);

  const annotationLanes = useMemo(() => scheduleVideoAnnotationLane(annotations), [annotations]);
  const maxOrder = useMemo(() => {
    let order = 0;

    if (!annotations.length) {
      return 0;
    }

    annotations.forEach((item) => {
      order = Math.max(order, item.order);
    });

    return order;
  }, [annotations]);

  useEffect(() => {
    setSelectedAnnotation(propsSelectedAnnotation);
  }, [propsSelectedAnnotation]);

  useEffect(() => {
    setSelectedAnnotation(undefined);
  }, [editingType]);

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

  const handleExpandTriggerClick = () => {
    setExpanded((prev) => !prev);
  };

  const resetEditingAnnotation = useCallback(() => {
    setEditingAnnotation(null);
    editingSegmentAnnotationRef.current = null;
  }, []);

  const scrollToCurrentAnnotation = useCallback(
    (_annotation: VideoAnnotationInUI) => {
      // 滚动到当前轨道
      setTimeout(() => {
        if (!laneRef.current || !activityBarRef.current) {
          return;
        }
        const newAnnotationLanes = scheduleVideoAnnotationLane([...annotations, _annotation]);
        const currentLaneIndex = newAnnotationLanes.findIndex((lane) =>
          (lane as VideoAnnotationInUI[]).find((item: VideoAnnotationInUI) => item.id === _annotation.id),
        );
        laneRef.current.scrollTop = currentLaneIndex * activityBarRef.current.clientHeight;
      });
    },
    [annotations],
  );

  const finishAnnotation = useCallback(
    (_annotation: VideoAnnotationInUI, e?: MouseEvent) => {
      onAdd?.(_annotation);
      onAnnotateEnd?.(_annotation, e);
      setSelectedAnnotation(_annotation);
      resetEditingAnnotation();
      scrollToCurrentAnnotation(_annotation);
    },
    [onAdd, onAnnotateEnd, resetEditingAnnotation, scrollToCurrentAnnotation],
  );

  const handlePlayStatusChange = useCallback((isPlaying: boolean) => {
    isPlayingRef.current = isPlaying;
  }, []);

  const handlePlaying = useCallback(() => {
    const frame = frameRef.current;

    if (frame && playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      frame.style.left = `${(currentTime / duration) * 100}%`;

      const playingIds = annotations
        .filter((item) => {
          if (item.type === 'frame') {
            return item.time === currentTime;
          }

          return item.start <= currentTime && item.end >= currentTime;
        })
        .map((item) => item.id);

      setPlayingAnnotationIds((pre) => {
        if (pre.join(',') === playingIds.join(',')) {
          return pre;
        }

        return playingIds;
      });

      if (editingAnnotation && editingElementRef.current) {
        editingElementRef.current.style.width = `${((currentTime - editingAnnotation.start!) / duration) * 100}%`;

        // 播放结束时但没有标注结束时间点
        if (
          currentTime === duration &&
          editingType === 'segment' &&
          !annotations.find((item) => item.id === editingAnnotation.id)
        ) {
          isSettingCurrentTimeRef.current = false;
          finishAnnotation({
            ...editingAnnotation,
            end: duration,
          });
        }
      }
    }
  }, [annotations, duration, editingAnnotation, editingType, finishAnnotation]);

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSettingCurrentTimeRef.current || !activityBarRef.current) {
      return;
    }

    const rect = activityBarRef.current.getBoundingClientRect();
    const frame = frameRef.current;
    const offsetX = e.clientX - rect.left;

    if (frame && playerRef.current) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
      playerRef.current.currentTime((offsetX / rect.width) * duration);
    }

    if (disabled) {
      return;
    }

    if (
      playerRef.current &&
      isSettingCurrentTimeRef.current &&
      editingSegmentAnnotationRef.current &&
      editingElementRef.current
    ) {
      if (editingSegmentAnnotationRef.current && editingElementRef.current) {
        editingElementRef.current.style.width = `${
          ((playerRef.current.currentTime() - editingSegmentAnnotationRef.current.start!) / duration) * 100
        }%`;
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);

    if (!activityBarRef.current) {
      return;
    }

    const rect = activityBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;

    isSettingCurrentTimeRef.current = false;

    if (disabled) {
      return;
    }

    if (isPlayingRef.current) {
      playerRef.current?.play();
    }

    if (
      editingSegmentAnnotationRef.current &&
      (offsetX * duration) / rect.width - editingSegmentAnnotationRef.current.start! > 0.2
    ) {
      finishAnnotation(
        {
          ...editingSegmentAnnotationRef.current,
          end: offsetX > rect.width ? duration : parseTime((offsetX / rect.width) * duration),
        },
        e,
      );
    }

    if (editingType === 'frame') {
      finishAnnotation({
        id: uid(),
        type: 'frame',
        time: parseTime((offsetX / rect.width) * duration),
        label: editingLabel ?? '',
        order: maxOrder + 1,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const frame = frameRef.current;

    if (frame && playerRef.current) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
      playerRef.current.currentTime((offsetX / rect.width) * duration);
      isSettingCurrentTimeRef.current = true;

      if (disabled) {
        return;
      }

      if (editingType === 'segment') {
        if (
          editingSegmentAnnotationRef.current &&
          (offsetX * duration) / rect.width > editingSegmentAnnotationRef.current.start!
        ) {
          finishAnnotation(
            {
              ...editingSegmentAnnotationRef.current,
              end: parseTime((offsetX / rect.width) * duration),
            },
            e.nativeEvent,
          );
        } else {
          const newAnnotation = {
            id: uid(),
            type: 'segment',
            start: parseTime((offsetX / rect.width) * duration),
            end: parseTime((offsetX / rect.width) * duration),
            order: maxOrder + 1,
            label: editingLabel,
          } as VideoSegmentAnnotation;
          editingSegmentAnnotationRef.current = newAnnotation;
          setEditingAnnotation(newAnnotation);
          setSelectedAnnotation(newAnnotation);
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  };

  const handleAnnotationSelect = useCallback(
    (_annotation: VideoAnnotationInUI) => {
      setSelectedAnnotation(_annotation);
      setPlayingAnnotationIds([]);
      onAnnotationSelect?.(_annotation);
    },
    [onAnnotationSelect],
  );

  const handleAnnotationChange = useCallback(
    (_annotation: VideoAnnotationInUI) => {
      onChange?.(_annotation);
      scrollToCurrentAnnotation(_annotation);
    },
    [onChange, scrollToCurrentAnnotation],
  );

  // ================== 快捷键 ==================

  // 取消标记 和 暂停/播放
  useHotkeys(
    'space',
    () => {
      if (playerRef.current) {
        if (playerRef.current.paused()) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
      }
    },
    {
      preventDefault: true,
    },
    [],
  );

  useHotkeys(
    'escape',
    resetEditingAnnotation,
    {
      preventDefault: true,
    },
    [resetEditingAnnotation],
  );

  // 标记片断
  useHotkeys(
    'x',
    () => {
      if (editingSegmentAnnotationRef.current) {
        finishAnnotation({
          ...editingSegmentAnnotationRef.current,
          end: playerRef.current.currentTime(),
        });
      } else {
        const newAnnotation = {
          id: uid(),
          type: 'segment',
          start: playerRef.current.currentTime(),
          end: playerRef.current.currentTime(),
          order: maxOrder + 1,
          label: editingLabel,
        } as VideoSegmentAnnotation;
        editingSegmentAnnotationRef.current = newAnnotation;
        setEditingAnnotation(newAnnotation);
        setSelectedAnnotation(newAnnotation);
      }
    },
    {
      preventDefault: true,
      enabled: editingType === 'segment',
    },
    [setEditingAnnotation, setSelectedAnnotation, finishAnnotation, editingLabel, maxOrder, editingType],
  );

  // 标记时间戳
  useHotkeys(
    'e',
    () => {
      finishAnnotation({
        id: uid(),
        type: 'frame',
        time: playerRef.current.currentTime(),
        label: editingLabel ?? '',
        order: maxOrder + 1,
      });
    },
    {
      preventDefault: true,
      enabled: editingType === 'frame',
    },
    [finishAnnotation, editingLabel, maxOrder, editingType],
  );

  // 快进10s
  useHotkeys(
    'ArrowRight',
    () => {
      if (playerRef.current) {
        playerRef.current.currentTime(playerRef.current.currentTime() + 10);
      }
    },
    {
      preventDefault: true,
    },
    [finishAnnotation, editingLabel, maxOrder, editingType],
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
      preventDefault: true,
    },
    [finishAnnotation, editingLabel, maxOrder, editingType],
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
      const _attributes: Attribute[] = toolConfig?.[_key]?.attributes ?? [];

      _attributes.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[_key]);
    });

    return mapping;
  }, [toolConfig]);

  const contextValue = useMemo(() => {
    return {
      editingAnnotation,
      duration,
      playerRef,
      onChange,
      selectedAnnotation,
      selectAnnotation: handleAnnotationSelect,
      onAnnotationChange: handleAnnotationChange,
      attributeConfigMapping,
      playingAnnotationIds,
      showOrder,
    };
  }, [
    duration,
    editingAnnotation,
    handleAnnotationChange,
    handleAnnotationSelect,
    onChange,
    showOrder,
    selectedAnnotation,
    attributeConfigMapping,
    playingAnnotationIds,
  ]);

  return (
    <VideoAnnotationContext.Provider value={contextValue}>
      <GlobalStyle />
      <VideoPlayer
        src={src}
        className={className}
        ref={playerRef}
        wrapperRef={ref}
        onStatusChange={handlePlayStatusChange}
        onMetaDataLoad={(videoElement) => setDuration(videoElement.duration)}
        onPlaying={handlePlaying}
      >
        <BarWrapper expanded={expanded}>
          <div className="lane-wrapper" ref={laneRef}>
            {annotationLanes.map((lane, index) => (
              <AnnotationBar key={index} annotations={lane} />
            ))}
          </div>
          {annotationLanes.length > 1 && (
            <ExpandTrigger expanded={expanded} onClick={handleExpandTriggerClick}>
              <ExpandIcon className="expand-icon" />
            </ExpandTrigger>
          )}
          <div>
            <ActivityBar
              editingType={disabled ? undefined : editingType}
              onMouseDown={handleMouseDown}
              ref={activityBarRef}
            >
              {editingAnnotation && (
                <AttributeItem
                  ref={editingElementRef}
                  barWrapperRef={activityBarRef}
                  key={editingAnnotation.id}
                  annotation={editingAnnotation}
                  attributeConfig={attributeConfigMapping[editingAnnotation.type][editingAnnotation.label] ?? {}}
                />
              )}
            </ActivityBar>
            <div ref={frameRef} className="player-frame" />
          </div>
        </BarWrapper>
      </VideoPlayer>
    </VideoAnnotationContext.Provider>
  );
});
