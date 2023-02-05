import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckOutlined } from '@ant-design/icons';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import { updateConfigStep } from '../../stores/task.store';

const Step = (props: any) => {
  const configStep = useSelector(commonController.getConfigStep);
  const haveConfigedStep = useSelector(commonController.getHaveConfigedStep);
  const { title, ordinalNumber, contentUrl } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const turnToOutlet = () => {
    if (configStep !== ordinalNumber - 2 && haveConfigedStep < ordinalNumber && haveConfigedStep !== 2) {
      commonController.notificationWarnMessage({ message: '请先完成上一步配置，再进行下一步操作' }, 1);
      return;
    }
    navigate(contentUrl);
    // @ts-ignore
    dispatch(updateConfigStep(ordinalNumber - 2));
  };
  return (
    <div className={currentStyles.outerFrame} onClick={turnToOutlet}>
      {configStep === ordinalNumber - 2 && haveConfigedStep < ordinalNumber && (
        <React.Fragment>
          <div className={currentStyles.iconHighlight}>{ordinalNumber}</div>
          <div className={currentStyles.titleHighlight}> {title} </div>
        </React.Fragment>
      )}

      {configStep !== ordinalNumber - 2 && haveConfigedStep < ordinalNumber && (
        <React.Fragment>
          <div className={currentStyles.icon}>{ordinalNumber}</div>
          <div className={currentStyles.title}> {title} </div>
        </React.Fragment>
      )}

      {configStep === ordinalNumber - 2 && haveConfigedStep >= ordinalNumber && (
        <React.Fragment>
          <div className={currentStyles.iconCheckHighlight}>
            <CheckOutlined />
          </div>
          <div className={currentStyles.titleHighlight}> {title} </div>
        </React.Fragment>
      )}

      {configStep !== ordinalNumber - 2 && haveConfigedStep >= ordinalNumber && (
        <React.Fragment>
          <div className={currentStyles.iconCheck}>
            <CheckOutlined />
          </div>
          <div className={currentStyles.title}> {title} </div>
        </React.Fragment>
      )}
    </div>
  );
};
export default Step;
