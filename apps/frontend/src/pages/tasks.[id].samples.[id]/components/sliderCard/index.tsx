import React from 'react';
import { useParams } from 'react-router';
import _ from 'lodash-es';
import { VideoCard } from '@label-u/video-annotator-react';
import classNames from 'classnames';

import type { SampleResponse } from '@/services/types';
import { MediaType } from '@/services/types';

import styles from './index.module.scss';

interface SliderCardProps {
  cardInfo: SampleResponse;
  type: MediaType;
  onClick: (sample: SampleResponse) => void;
}

const SliderCard = ({ type, cardInfo, onClick }: SliderCardProps) => {
  const { id, state, data } = cardInfo;
  const headId = _.chain(data).get('fileNames').keys().head().value();
  const url = _.get(data, `urls.${headId}`);
  const routeParams = useParams();
  const sampleId = +routeParams.sampleId!;

  const handleOnClick = (sample: SampleResponse) => {
    if (sample.id === sampleId) {
      return;
    }

    onClick(sample);
  };

  return (
    <React.Fragment>
      <div className={styles.outerFrame}>
        <div
          className={classNames(styles.content, {
            [styles.active]: id === sampleId,
          })}
          onClick={() => handleOnClick(cardInfo)}
        >
          {type === MediaType.IMAGE && <img src={url} alt="" />}
          {type === MediaType.VIDEO && <VideoCard src={url!} showPlayIcon showDuration />}
          {state === 'DONE' && (
            <React.Fragment>
              <div className={styles.tagBottom} />
              <div className={styles.tagTop}>
                <img src="/src/icons/check.png" alt="" />
              </div>
            </React.Fragment>
          )}
          {state === 'SKIPPED' && <div className={styles.skipped}>跳过</div>}
        </div>
        <div className={styles.id}>{id}</div>
      </div>
    </React.Fragment>
  );
};
export default SliderCard;
