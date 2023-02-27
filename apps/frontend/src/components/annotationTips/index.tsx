import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useSelector } from 'react-redux';

import IconText from '../IconText';

const AnnotationTips = () => {
  // @ts-ignore
  const taskTips = useSelector((state) => state.existTask.taskTips);

  const clickShowModal = () => {
    Modal.success({
      title: '标注提示',
      content: taskTips,
    });
  };
  return (
    <div onClick={() => clickShowModal()}>
      <IconText iconPlacement="right" icon={<QuestionCircleOutlined />}>
        标注提示
      </IconText>
    </div>
  );
};
export default AnnotationTips;
