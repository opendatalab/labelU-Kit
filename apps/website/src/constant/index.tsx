import { ReactComponent as VideoIcon } from '@/assets/video.svg';
import { ReactComponent as AudioIcon } from '@/assets/audio.svg';
import { ReactComponent as ImageIcon } from '@/assets/image.svg';

export const MENU = [
  {
    name: '图片',
    path: '/image',
    icon: <ImageIcon className="text-lg" />,
  },
  {
    name: '音频',
    path: '/audio',
    icon: <AudioIcon className="text-lg" />,
  },
  {
    name: '视频',
    path: '/video',
    icon: <VideoIcon className="text-lg" />,
  },
];
