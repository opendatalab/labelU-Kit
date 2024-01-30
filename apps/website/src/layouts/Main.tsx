import { Link } from 'react-router-dom';

import { MENU } from '@/constant';

const extraLinks = [
  {
    name: 'LabelU',
    path: 'https://opendatalab.github.io/labelU/',
  },
  {
    name: 'OpenDataLab',
    path: 'https://opendatalab.com/',
  },
];

export default ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between px-4 leading-[48px] h-12">
        <div className="flex gap-6">
          <div>
            <Link to="/">Back to homepage</Link>
          </div>
          <div className="flex gap-2">
            {MENU.map((menu) => {
              return (
                <Link key={menu.path} to={menu.path}>
                  {menu.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex gap-4">
          {extraLinks.map((link) => {
            return (
              <div key={link.name}>
                <a href={link.path} target="_blank" rel="noreferrer">
                  {link.name}
                </a>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 bg-slate-100 flex flex-col">{children}</div>
    </div>
  );
};
