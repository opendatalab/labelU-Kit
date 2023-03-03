import { useState, useCallback, useEffect } from 'react';

export const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    // 当hash发生变化时
    const handleChangeEvent = () => {
      setHash(window.location.hash);
    };

    // 监听 hashchange ，当 hash 发生变化时执行
    window.addEventListener('hashchange', handleChangeEvent);
    // 组件卸载时将监听事件进行移除
    return () => {
      window.removeEventListener('hashchange', handleChangeEvent);
    };
  }, []);

  // 更新 hash
  const updateHash = useCallback(
    (newHash: string) => {
      // 只有当新输入的 hash 跟原有的 hash 不一致时才进行更新
      if (newHash !== hash) {
        window.location.hash = newHash;
      }
    },
    [hash],
  );

  // 将当前的 hash 和 updateHash 暴露出去给外面进行使用
  return [hash, updateHash] as const;
};
