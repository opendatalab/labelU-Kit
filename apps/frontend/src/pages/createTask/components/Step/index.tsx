import React from 'react';
import { CheckOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import Separator from '@/components/separator';

import styles from './index.module.scss';

export interface StepData {
  title: string;
  value: any;
  isFinished?: boolean;
}

interface StepItemProps {
  isEnd: boolean;
  active?: boolean;
  index: number;
  step: StepData;
  currentStep: StepData;
  onClick: (e: React.MouseEvent) => void;
}

const StepItem = ({ step, index, isEnd, onClick, active }: StepItemProps) => {
  return (
    <div className={styles.stepItem}>
      <div
        className={classNames(styles.stepItemInner, {
          [styles.active]: active,
          [styles.finished]: step.isFinished,
        })}
        onClick={onClick}
      >
        <div className={styles.icon}>{step.isFinished ? <CheckOutlined /> : index + 1}</div>
        <div className={styles.title}> {step.title} </div>
      </div>
      {!isEnd && <Separator />}
    </div>
  );
};

interface StepProps {
  steps: StepData[];
  currentStep: any;
  onNext: (step: StepData) => void;
  onPrev: (step: StepData) => void;
}

export default function Step({ steps, currentStep, onNext, onPrev }: StepProps) {
  const currentStepIndex = steps.findIndex((step) => step.value === currentStep);
  const currentStepData = steps[currentStepIndex];

  const handleOnClick = (step: StepData, index: number) => {
    if (index > currentStepIndex && typeof onNext === 'function') {
      onNext(step);
    }

    if (index < currentStepIndex && typeof onPrev === 'function') {
      onPrev(step);
    }
  };

  return (
    <div className={styles.stepWrapper}>
      {steps.map((step, index) => {
        return (
          <StepItem
            key={step.value}
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
