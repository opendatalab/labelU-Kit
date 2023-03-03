import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import commonController from '@/utils/common/common';
import history from '@/routes/history';
import Separator from '@/components/separator';

import styles from './index.module.scss';

interface StepData {
  title: string;
  value: string | number;
  isFinished?: boolean;
}

interface StepItemProps {
  isEnd: boolean;
  active?: boolean;
  index: number;
  step: StepData;
  currentStep: StepData;
  showStepNumber: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const StepItem = ({ step, index, showStepNumber, isEnd, onClick, active }: StepItemProps) => {
  return (
    <div className={styles.stepItem}>
      <div
        className={classNames(styles.stepItemInner, {
          [styles.active]: active,
          [styles.finished]: step.isFinished,
        })}
        onClick={onClick}
      >
        <div className={styles.icon}>{showStepNumber ? index + 1 : <CheckOutlined />}</div>
        <div className={styles.title}> {step.title} </div>
      </div>
      {!isEnd && <Separator />}
    </div>
  );
};

interface StepProps {
  steps: StepData[];
  showStepNumber?: boolean;
  currentStep: string | number;
  onNext: (step: StepData) => void;
  onPrev: (step: StepData) => void;
}

export default function Step({ steps, currentStep, showStepNumber = false, onNext, onPrev }: StepProps) {
  const navigate = useNavigate();

  const currentStepIndex = steps.findIndex((step) => step.value === currentStep);
  const currentStepData = steps[currentStepIndex];

  const handleOnClick = (step: StepData, index: number) => {
    if (currentStepIndex < index && !currentStepData.isFinished) {
      commonController.notificationWarnMessage({ message: '请先完成上一步配置，再进行下一步操作' }, 1);
      return;
    }

    if (index > currentStepIndex && typeof onNext === 'function') {
      onNext(step);
    }

    if (index < currentStepIndex && typeof onPrev === 'function') {
      onPrev(step);
    }

    navigate(`${history.location.pathname}#${step.value}`);
  };

  return (
    <div className={styles.stepWrapper}>
      {steps.map((step, index) => {
        return (
          <StepItem
            key={step.value}
            showStepNumber={showStepNumber}
            active={currentStepIndex === index}
            onClick={() => handleOnClick(step, index)}
            step={step}
            isEnd={index === steps.length - 1}
            index={index}
            currentStep={currentStepData}
          />
        );
      })}
    </div>
  );
}
