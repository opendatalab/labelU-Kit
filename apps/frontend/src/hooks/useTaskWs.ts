import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import WebSocketClient from '@/classes/WebsocketClient';

export interface TaskCollaboratorInWs {
  user_id: number;
  username: string;
  sample_id: number;
}

export interface TaskUser {
  user_id: number;
  username: string;
  task_id: number;

  collaborators: TaskCollaboratorInWs[];
}

export default function useTaskWs(): [TaskUser[], TaskCollaboratorInWs[]] {
  const routeParams = useParams();
  const [connections, setConnections] = useState<TaskUser[]>([]);
  const [collaborators, setCollaborators] = useState<TaskCollaboratorInWs[]>([]);

  useEffect(() => {
    const host = window.location.host;
    const token = localStorage.getItem('token')?.split(' ')[1];
    const ws = new WebSocketClient(`ws://${host}/ws/task/${routeParams.taskId}?token=${token}`);

    ws.on('connected', (data) => {
      const userIds: number[] = [];
      const result: TaskUser[] = [];

      for (const item of data.connections) {
        if (userIds.includes(item.user_id)) {
          continue;
        }

        userIds.push(item.user_id);
        result.push(item);
      }

      setConnections(result);
      setCollaborators(data.collaborators);
    });

    return () => {
      ws.disconnect();
    };
  }, [routeParams.sampleId, routeParams.taskId]);

  return [connections, collaborators];
}
