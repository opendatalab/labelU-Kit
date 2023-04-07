import { useContext } from 'react';

import ViewContext from '@/view.context';

export default function useViewContext() {
  const context = useContext(ViewContext);
}
