import VideoAnnotator from '@labelu/video-react';
import '@labelu/video-react/dist/style.css';
import { forwardRef } from 'react';
import { MediaAnnotatorWrapper } from '@labelu/audio-annotator-react';
import type { AudioAndVideoAnnotatorRef, AnnotatorProps } from '@labelu/audio-annotator-react';

function ForwardAnnotator({ samples, ...props }: AnnotatorProps, ref: React.Ref<AudioAndVideoAnnotatorRef>) {
  return (
    <MediaAnnotatorWrapper samples={samples} ref={ref} {...props}>
      {(annotatorProps) => <VideoAnnotator {...annotatorProps} className="labelu-video-wrapper" />}
    </MediaAnnotatorWrapper>
  );
}

export const Annotator = forwardRef<AudioAndVideoAnnotatorRef, AnnotatorProps>(ForwardAnnotator);
