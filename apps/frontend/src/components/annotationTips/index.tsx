import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useSelector } from 'react-redux';

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
      标注提示&nbsp;
      <QuestionCircleOutlined />
    </div>
  );
};
export default AnnotationTips;
