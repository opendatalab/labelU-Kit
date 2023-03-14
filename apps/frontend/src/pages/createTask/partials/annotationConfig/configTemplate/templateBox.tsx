import type { FC } from 'react';
import { useContext } from 'react';

import { TaskCreationContext } from '@/pages/createTask/taskCreation.context';

export interface Item {
  img: any;
  templateName: string;
  label: string;
}
interface Iprops {
  templates: Item[];
  hideBox: () => void;
}

const TemplateBox: FC<Iprops> = ({ templates, hideBox }) => {
  const { updateFormData } = useContext(TaskCreationContext);

  const updateToolConfig = (item: Item) => {
    if (typeof item.templateName === 'object' && !Array.isArray(item.templateName)) {
      const initConfig = {
        tools: [],
        tagList: [],
        attribute: [],
        textConfig: [],
        ...(item.templateName as Record<string, unknown>),
      };

      updateFormData('config')(initConfig);
    }
  };

  return (
    <div className="tabContentBox">
      {templates.map((item) => {
        return (
          <div
            key={item.label}
            className="imgBox"
            onDoubleClick={() => {
              updateToolConfig(item);
              hideBox();
            }}
          >
            <img alt={item.label} src={item.img} />
            <p>{item.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default TemplateBox;
