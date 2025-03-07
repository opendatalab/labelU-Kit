import { useEffect, useRef, useState } from 'react';
import { useParams, useRevalidator } from 'react-router-dom';

import WebSocketClient from '@/classes/WebsocketClient';

import useMe from './useMe';

export interface TaskSampleUser {
  user_id: number;
  username: string;
  task_id: number;
  sample_id: number;
}

export default function useSampleWs() {
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const me = useMe();
  const [connections, setConnections] = useState<TaskSampleUser[]>([]);
  const host = window.location.host;
  const token = localStorage.getItem('token')?.split(' ')[1];
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocketClient(
      `ws://${host}/ws/task/${routeParams.taskId}/${routeParams.sampleId}?token=${token}`,
    );

    const ws = wsRef.current;

    ws.on('peers', (data) => {
      const userIds: number[] = [];
      const result: TaskSampleUser[] = [];

      for (const item of data) {
        if (userIds.includes(item.user_id)) {
          continue;
        }

        userIds.push(item.user_id);
        result.push(item);
      }

      setConnections(() => {
        return result;
      });
    });

    return () => {
      ws.disconnect();
    };
  }, [host, routeParams.sampleId, routeParams.taskId, token]);

  useEffect(() => {
    if (!wsRef.current) {
      return;
    }

    const ws = wsRef.current;
    const handleLeave = (data: TaskSampleUser) => {
      if (data.user_id !== me.data?.id) {
        revalidator.revalidate();
      }
    };

    ws.on('leave', handleLeave);

    return () => {
      ws.off('leave', handleLeave);
    };
  }, [me.data?.id, revalidator]);

  return connections;
}
