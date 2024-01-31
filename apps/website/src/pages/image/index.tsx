import { CodeOutlined, SettingOutlined } from '@ant-design/icons';
import { Annotator as ImageAnnotator } from '@labelu/image-annotator-react';
import type { ToolName } from '@labelu/image';
import { TOOL_NAMES } from '@labelu/image';
import type { TabsProps } from 'antd';
import { Button, Drawer, Form, Tabs } from 'antd';
import { useRef, useState } from 'react';

import lineTemplate from '@/constant/templates/line.template';
import rectTemplate from '@/constant/templates/rect.template';
import polygonTemplate from '@/constant/templates/polygon.template';
import pointTemplate from '@/constant/templates/point.template';
import cuboidTemplate from '@/constant/templates/cuboid.template';
import tagTemplate from '@/constant/templates/tag.template';
import textTemplate from '@/constant/templates/text.template';
import FancyForm from '@/components/FancyForm';
import { add } from '@/components/FancyInput';
import { FancyAttributeList } from '@/components/CustomFancy/ListAttribute.fancy';
import { FancyCategoryAttribute } from '@/components/CustomFancy/CategoryAttribute.fancy';

add('list-attribute', FancyAttributeList);
add('category-attribute', FancyCategoryAttribute);

const templateMapping: Record<ToolName | 'tag' | 'text', any> = {
  line: lineTemplate,
  rect: rectTemplate,
  polygon: polygonTemplate,
  point: pointTemplate,
  cuboid: cuboidTemplate,
  tag: tagTemplate,
  text: textTemplate,
};

const presetSamples = [
  {
    url: import.meta.env.BASE_URL + 'sample-1.jpg',
    name: 'sample-1',
    id: 'sample-1',
    meta: {
      width: 1700,
      height: 957,
      rotate: 0,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-2.jpg',
    name: 'sample-2',
    id: 'sample-2',
    meta: {
      width: 1280,
      height: 800,
      rotate: 0,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-3.jpg',
    name: 'sample-3',
    id: 'sample-3',
    meta: {
      width: 1280,
      height: 800,
      rotate: 0,
    },
    data: {},
  },
  {
    url: import.meta.env.BASE_URL + 'sample-4.jpg',
    name: 'sample-4',
    id: 'sample-4',
    meta: {
      width: 1280,
      height: 800,
      rotate: 0,
    },
    data: {},
  },
];

const defaultConfig = {
  point: { maxPointAmount: 100, labels: [{ color: '#1899fb', key: 'Glass', value: 'glass' }] },
  line: {
    lineType: 'line',
    minPointAmount: 2,
    maxPointAmount: 100,
    edgeAdsorptive: false,
    labels: [{ color: '#ff0000', key: 'Lane', value: 'lane' }],
  },
  rect: { minWidth: 1, minHeight: 1, labels: [{ color: '#00ff1e', key: 'Helmet', value: 'helmet' }] },
  polygon: {
    lineType: 'line',
    minPointAmount: 2,
    maxPointAmount: 100,
    edgeAdsorptive: false,
    labels: [{ color: '#ff6600', key: 'Building', value: 'building' }],
  },
  cuboid: {
    labels: [
      { color: '#ff00d0', key: 'SUV', value: 'suv' },
      { color: '#ff6d2e', key: 'Car', value: 'car' },
    ],
  },
};

export default function ImagePage() {
  const annotatorRef = useRef<any>();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [currentSample, updateSample] = useState(presetSamples[0]);
  const [form] = Form.useForm();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    form.validateFields().then(() => {
      setOpen(false);
      form.submit();
    });
  };

  const onFinish = (values: any) => {
    setConfig(values.tools);
  };

  const items: TabsProps['items'] = TOOL_NAMES.map((item) => ({
    key: item,
    label: item,
    forceRender: true,
    children: <FancyForm template={templateMapping[item]} name={['tools', item]} />,
  }));

  return (
    <>
      <ImageAnnotator
        toolbarRight={
          <div className="flex items-center gap-2">
            {/* <Button type="primary" icon={<CodeOutlined rev={undefined} />} onClick={showDrawer}>
              标注结果
            </Button> */}
            <Button icon={<SettingOutlined rev={undefined} />} onClick={showDrawer} />
          </div>
        }
        samples={presetSamples}
        ref={annotatorRef}
        offsetTop={148}
        editingSample={currentSample}
        config={config}
      />
      <Drawer width={480} title="工具配置" onClose={onClose} open={open}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            tools: defaultConfig,
          }}
        >
          <Tabs items={items} />
        </Form>
      </Drawer>
    </>
  );
}
