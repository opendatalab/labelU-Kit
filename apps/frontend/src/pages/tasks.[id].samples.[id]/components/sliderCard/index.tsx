import React from 'react';
import { useParams } from 'react-router';
import _ from 'lodash-es';

import type { SampleResponse } from '@/services/types';

import styles from './index.module.scss';

interface SliderCardProps {
  cardInfo: SampleResponse;
  onClick: (sample: SampleResponse) => void;
}

const SliderCard = ({ cardInfo, onClick }: SliderCardProps) => {
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
      {id === sampleId && (
        <div className={styles.outerFrame}>
          <div className={styles.contentActive} onClick={() => handleOnClick(cardInfo)}>
            <img src={url} alt="" style={{ height: '100%', maxWidth: '100%' }} />
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
          <div className={styles.idHighlight}>{id}</div>
        </div>
      )}
      {id !== sampleId && (
        <div className={styles.outerFrame}>
          <div className={styles.content} onClick={() => handleOnClick(cardInfo)}>
            <img src={url} alt="" style={{ height: '100%', maxWidth: '100%' }} />
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
          <div>{id}</div>
        </div>
      )}
    </React.Fragment>
  );
};
export default SliderCard;
