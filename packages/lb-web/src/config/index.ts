interface config {
  [key: string]: string;
}
type GetConfig = () => config;

const getConfig: GetConfig = () => {
  const conf: {
    [key: string]: string;
  } = {};

  if (process.env.NODE_ENV === 'development') {
    conf['host'] = 'ws://localhost:18080';
    conf['pluginHost'] = 'http://localhost:8080'
  } else {
    conf['host'] = 'ws://10.158.41.45:18080';
    conf['pluginHost'] = 'http://10.158.41.45:3003'
  }
  return conf;
};

export default getConfig;
