import React from 'react';
import { useParams } from 'react-router';
import _ from 'lodash-es';
import { VideoCard } from '@labelu/video-annotator-react';
import { AudioCard } from '@labelu/components-react';

import type { SampleResponse } from '@/api/types';
import { MediaType } from '@/api/types';
// import checkIconUrl from '@/assets/png/check.png';
import { ReactComponent as CheckSvgIcon } from '@/assets/svg/check.svg';

import { AudioWrapper, CheckBg, Triangle, ContentWrapper, IdWrapper, SkipWrapper, Wrapper } from './style';

function CheckIcon() {
  return (
    <CheckBg>
      <Triangle />
      <CheckSvgIcon />
    </CheckBg>
  );
}

interface SliderCardProps {
  cardInfo: SampleResponse;
  type?: MediaType;
  index?: number;
  onClick: (sample: SampleResponse) => void;
}

const SliderCard = ({ type, cardInfo, index, onClick }: SliderCardProps) => {
  const { id, state, data } = cardInfo;
  const headId = _.chain(data).get('fileNames').keys().head().value();
  const filename = _.get(data, `fileNames.${headId}`);
  const url = _.get(data, `urls.${headId}`);
  const routeParams = useParams();
  const sampleId = +routeParams.sampleId!;

  const handleOnClick = (sample: SampleResponse) => {
    if (sample.id === sampleId) {
      return;
    }

    onClick(sample);
  };

  if (type === MediaType.AUDIO) {
    return (
      <AudioWrapper flex="column" items="stretch" justify="center" onClick={() => handleOnClick(cardInfo)}>
        {type === MediaType.AUDIO && (
          <AudioCard src={url!} active={id === sampleId} title={filename} no={index! + 1} showNo />
        )}
        {state === 'DONE' && <CheckIcon />}
        {state === 'SKIPPED' && <SkipWrapper>跳过</SkipWrapper>}
      </AudioWrapper>
    );
  }

  return (
    <Wrapper items="center" flex="column" justify="center">
      <ContentWrapper
        flex="column"
        items="center"
        justify="center"
        active={id === sampleId}
        onClick={() => handleOnClick(cardInfo)}
      >
        {type === MediaType.IMAGE && <img src={url} alt="" />}
        {type === MediaType.VIDEO && <VideoCard src={url!} showPlayIcon showDuration />}
        {state === 'DONE' && <CheckIcon />}
        {state === 'SKIPPED' && <SkipWrapper>跳过</SkipWrapper>}
      </ContentWrapper>
      <IdWrapper>{id}</IdWrapper>
    </Wrapper>
  );
};
export default SliderCard;
