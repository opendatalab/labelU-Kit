import { Modal } from 'antd';
import type { ModalProps } from 'antd/lib/modal';
import type { FormProps } from 'antd/lib/form';
import { useForm } from 'antd/lib/form/Form';

import MyForm from '../form';

type FilteredModalProps = Omit<ModalProps, 'onOk' | 'onCancel'>;

interface MyModalProps<FormValues> extends FilteredModalProps {
  form?: FormValues;
  formProps?: FormProps<FormValues>;
  children?: React.ReactNode;
  onClose?: (formData?: FormValues) => any;
}

const BaseModal = <FormValues extends Record<string, unknown>>(props: MyModalProps<FormValues>) => {
  const { form, formProps, children, onClose, ...rest } = props;
  const [formInstance] = useForm<FormValues>();

  const onOk = async () => {
    if (form) {
      const data = await formInstance.validateFields();
      if (onClose) {
        onClose(data);
      }
    } else {
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <Modal {...rest} onCancel={() => onClose?.()} onOk={onOk}>
      {form ? (
        <MyForm {...formProps} form={formInstance}>
          {children}
        </MyForm>
      ) : (
        children
      )}
    </Modal>
  );
};

BaseModal.defaultProps = {
  width: '1000px',
};

const MyModal = Object.assign(BaseModal, Modal);

export default MyModal;
