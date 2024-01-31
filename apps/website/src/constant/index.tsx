import { ReactComponent as VideoIcon } from '@/assets/video.svg';
import { ReactComponent as AudioIcon } from '@/assets/audio.svg';
import { ReactComponent as ImageIcon } from '@/assets/image.svg';

export const MENU = [
  {
    name: 'Image',
    path: '/image',
    icon: <ImageIcon className="text-lg" />,
  },
  {
    name: 'Audio',
    path: '/audio',
    icon: <AudioIcon className="text-lg" />,
  },
  {
    name: 'Video',
    path: '/video',
    icon: <VideoIcon className="text-lg" />,
  },
];
