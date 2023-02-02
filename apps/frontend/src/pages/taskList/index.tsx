import React, { useState, useEffect } from 'react';
import currentStyles from './index.module.scss';
import { Pagination } from 'antd';
import TaskCard from '../../components/taskCard';
import { useNavigate } from 'react-router-dom';
import Constatns from '../../constants';
import { getTaskList, updateTaskConfig } from '../../services/createTask';
import CommonController from '../../utils/common/common';
import { useDispatch } from 'react-redux';
import { updateConfigStep, updateHaveConfigedStep, updateTask } from '../../stores/task.store';
import NullTask from '../nullTask';
import { clearConfig } from '../../stores/toolConfig.store';
const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const createTask = () => {
    dispatch(updateConfigStep(-1));
    dispatch(updateHaveConfigedStep(0));
    dispatch(
      updateTask({
        data: {
          name: '',
          tips: '',
          description: '',
          config: '',
        },
      }),
    );
    dispatch(clearConfig());
    navigate(Constatns.urlToCreateNewTask);
  };
  const [taskCards, setTaskCards] = useState<any>([]);
  const [taskTotal, setTaskTotal] = useState<any>(0);
  const changeCurrentPage = (page: number) => {
    requestTaskList(page - 1);
  };
  const requestTaskList = (page: number) => {
    getTaskList(page).then((res) => {
      if (res) {
        if (res.status === 200) {
          setTaskCards(res.data?.data);
          setTaskTotal(res.data?.meta_data?.total);
        } else {
          // CommonController.notificationErrorMessage({message : '拉取文件列表状态码不是200'},1);
        }
      } else {
        CommonController.notificationErrorMessage({ message: '拉取文件列表失败, 请刷新页面' }, 1);
      }
    });
  };
  useEffect(function () {
    requestTaskList(0);

    // setTaskCards([{
    //   id : 1,
    //   name : 'test1',
    //   "created_by" : {
    //       id : 2,
    //       username : 'test1@qq.com'
    //   },
    //   "created_at" : "2022-11-25T02:52:24.215Z",
    //   "annotated_count" : 1,
    //   "total" : 2,
    //   "status" : 2,    //不确定的
    //   "media_type" : "IMAGE"   // 也有点问题
    // },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     },
    //     {
    //         id : 1,
    //         name : 'test1',
    //         "created_by" : {
    //             id : 2,
    //             username : 'test1@qq.com'
    //         },
    //         "created_at" : "2022-11-25T02:52:24.215Z",
    //         "annotated_count" : 1,
    //         "total" : 2,
    //         "status" : 2,    //不确定的
    //         "media_type" : "IMAGE"   // 也有点问题
    //     }])
  }, []);

  useEffect(() => {
    requestTaskList(0);
  }, [window.location.search]);
  return (
    <React.Fragment>
      {taskCards.length > 0 && (
        <div className={currentStyles.outerFrame}>
          <div className={currentStyles.createTaskButtonRow}>
            <div className={currentStyles.createTaskButton} onClick={createTask}>
              新建任务
            </div>
          </div>
          <div className={currentStyles.cards}>
            {taskCards.map((cardInfo: any, cardInfoIndex: number) => {
              return <TaskCard key={cardInfoIndex} cardInfo={cardInfo} />;
            })}
          </div>
          <div className={currentStyles.pagination}>
            <Pagination defaultCurrent={1} total={taskTotal} pageSize={16} onChange={changeCurrentPage} />
          </div>
        </div>
      )}
      {taskCards.length === 0 && <NullTask />}
    </React.Fragment>
  );
};
export default TaskList;
