import React, { useEffect, useState } from 'react';

interface ModuleType {
  default: React.ComponentType<any>;
}

interface ComponentState {
  AsyncComponent: React.ComponentType<any> | null;
}
export default function dynamic(asyncComponent: () => Promise<ModuleType>) {
  return function Dynamic<T>(props: T) {
    const [{ AsyncComponent }, setComponent] = useState<ComponentState>({
      AsyncComponent: null,
    });

    useEffect(() => {
      asyncComponent().then((loadedModule) => {
        setComponent({
          AsyncComponent: loadedModule.default || loadedModule,
        });
      });
    }, []);

    if (!AsyncComponent) {
      return null;
    }

    return <AsyncComponent {...props} />;
  };
}
