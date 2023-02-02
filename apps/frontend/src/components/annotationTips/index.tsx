import React, { useState, useEffect } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useSelector } from 'react-redux';

const AnnotationTips = (props: any) => {
  const taskTips = useSelector((state) => state.existTask.taskTips);
  const [isShowModal, setIsShowModal] = useState(false);
  const clickShowModal = () => {
    Modal.success({
      title: '标注提示',
      content: taskTips,
    });
  };
  return (
    <div onClick={() => clickShowModal()}>
      标注提示&nbsp;
      <QuestionCircleOutlined />
    </div>
  );
};
export default AnnotationTips;
