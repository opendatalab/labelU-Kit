import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useLocale } from '../locales';

const NotFoundPage: React.FC<Record<string, unknown>> = () => {
  const navigate = useNavigate();
  const { formatMessage } = useLocale();
  return (
    <Result
      status="404"
      title="404"
      subTitle={formatMessage({ id: 'gloabal.tips.notfound' })}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          {formatMessage({ id: 'gloabal.tips.backHome' })}
        </Button>
      }
    />
  );
};

export default NotFoundPage;
