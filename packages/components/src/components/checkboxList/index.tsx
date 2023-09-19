import { Checkbox } from 'antd';
import React from 'react';

interface IProps {
  selectedAttribute: string[];
  attributeChanged: () => void;
  num?: any;
  list?: any[];
}

const CheckboxList = (props: IProps) => {
  const list = props.list || [];
  return (
    <div className="labelu-checkbox-group">
      <Checkbox.Group
        name="checkboxgroup"
        // defaultValue={props.selectedAttribute}
        value={props.selectedAttribute}
        onChange={() => props.attributeChanged()}
      >
        {list.map((i: any, index: number) => (
          <Checkbox value={i.value} key={index}>
            <span className="labelu-checkbox-label" title={i.label}>
              {i.label}
            </span>
            {/* <span className="labelu-checkbox-num">{props?.num ?? index}</span> */}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </div>
  );
};

export default CheckboxList;
