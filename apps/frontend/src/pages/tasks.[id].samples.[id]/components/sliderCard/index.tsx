import { useParams } from 'react-router';
import { VideoCard, AudioCard } from '@labelu/components-react';

import type { SampleResponse } from '@/api/types';
import { MediaType } from '@/api/types';
import { ReactComponent as CheckSvgIcon } from '@/assets/svg/check.svg';

import { CheckBg, Triangle, ContentWrapper, IdWrapper, SkipWrapper, Wrapper } from './style';

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
  const { id, inner_id, state, file } = cardInfo;
  const filename = file.filename;
  const url = file.url;
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
      <AudioCard
        src={url!}
        active={id === sampleId}
        onClick={() => handleOnClick(cardInfo)}
        title={filename.substring(9)}
        no={index! + 1}
        showNo
        completed={state === 'DONE'}
        skipped={state === 'SKIPPED'}
      />
    );
  }

  if (type === MediaType.VIDEO) {
    return (
      <div style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <VideoCard
          src={url!}
          title={inner_id}
          active={id === sampleId}
          onClick={() => handleOnClick(cardInfo)}
          showPlayIcon
          showDuration
          completed={state === 'DONE'}
          skipped={state === 'SKIPPED'}
        />
      </div>
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
        {state === 'DONE' && <CheckIcon />}
        {state === 'SKIPPED' && <SkipWrapper>跳过</SkipWrapper>}
      </ContentWrapper>
      <IdWrapper>{inner_id}</IdWrapper>
    </Wrapper>
  );
};
export default SliderCard;
