import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import WebSocketClient from '@/classes/WebsocketClient';

export interface TaskSampleUser {
  user_id: number;
  username: string;
  task_id: number;
  sample_id: number;
}

export default function useSampleWs() {
  const routeParams = useParams();
  const [connections, setConnections] = useState<TaskSampleUser[]>([]);

  useEffect(() => {
    const host = window.location.host;
    const token = localStorage.getItem('token')?.split(' ')[1];
    const ws = new WebSocketClient(`ws://${host}/ws/task/${routeParams.taskId}/${routeParams.sampleId}?token=${token}`);

    ws.on('active_connections', (data) => {
      const userIds: number[] = [];
      const result: TaskSampleUser[] = [];

      for (const item of data) {
        if (userIds.includes(item.user_id)) {
          continue;
        }

        userIds.push(item.user_id);
        result.push(item);
      }

      setConnections(result);
    });

    return () => {
      ws.disconnect();
    };
  }, [routeParams.sampleId, routeParams.taskId]);

  return connections;
}
