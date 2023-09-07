import type { Attribute, AttributeOption, InnerAttributeType, StringType } from '@label-u/interface';
import type { Rule, ValidateErrorEntity, NamePath } from 'rc-field-form/es/interface';
import type { FormProps, FormInstance } from 'rc-field-form';
import Form, { useForm, Field } from 'rc-field-form';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components';

export interface ValidationContextType {
  error: ValidateErrorEntity;
  submit: () => Promise<void>;
  form?: FormInstance;
}

const ValidateContext = createContext<ValidationContextType>({} as ValidationContextType);

export const AttributeFormItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 14px;

  margin-bottom: 1rem;

  .required-star {
    color: red;
    vertical-align: middle;
    margin-right: 2px;
  }

  .validation-wrapper {
    display: flex;
    flex-direction: column;
    color: red;
  }
`;

export function FormItem({
  children,
  label,
  required,
  errors,
  className,
}: React.PropsWithChildren<{
  label?: React.ReactNode;
  required?: boolean;
  errors?: string[];
  className?: string;
}>) {
  return (
    <AttributeFormItemWrapper className={className}>
      {label && (
        <label>
          {required && <span className="required-star">*</span>}
          {label}
        </label>
      )}
      {children}
      {errors && errors.length > 0 && (
        <div className="validation-wrapper">
          {errors.map((item) => {
            return (
              <div className="error-message" key={item}>
                {item}
              </div>
            );
          })}
        </div>
      )}
    </AttributeFormItemWrapper>
  );
}

export function FormWithValidation({ children, form, ...formProps }: React.PropsWithChildren<FormProps>) {
  const [error, setError] = useState<ValidateErrorEntity>({} as ValidateErrorEntity);
  const submit = useCallback(async () => {
    if (!form) {
      return;
    }

    try {
      await form.validateFields();
      form.submit();
    } catch (_error: any) {
      setError(_error);

      return Promise.reject(_error);
    }
  }, [form]);

  const contextValue = useMemo(() => {
    return {
      error,
      submit,
      form,
    };
  }, [error, form, submit]);

  return (
    <ValidateContext.Provider value={contextValue}>
      <Form form={form} {...formProps}>
        {children}
      </Form>
    </ValidateContext.Provider>
  );
}

interface FieldOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  onChange?: (value: string[] | undefined) => void;
  options: FieldOption[];
  value?: string[];
}

export const RadioGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1rem;

  label {
    cursor: pointer;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  input {
    cursor: pointer;
    margin: 0;
  }
`;

function RadioGroup({ onChange, value: propsValue, options }: RadioGroupProps) {
  const [value, setValue] = useState<string[] | undefined>(propsValue || []);
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue([e.target.value]);
    onChange?.([e.target.value]);
  };

  useEffect(() => {
    setValue(propsValue);
  }, [propsValue]);

  return (
    <RadioGroupWrapper>
      {options.map((item) => {
        return (
          <label key={item.value}>
            <input type="radio" checked={value?.includes(item.value)} onChange={handleOnChange} value={item.value} />{' '}
            {item.label}
          </label>
        );
      })}
    </RadioGroupWrapper>
  );
}

function CheckboxGroup({ onChange, value: propsValue, options }: RadioGroupProps) {
  const [value, setValue] = useState<string[] | undefined>(propsValue);
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string[] | undefined = [];

    if (e.target.checked) {
      newValue = [...(value ?? []), e.target.value];
    } else {
      newValue = value?.filter((item) => item !== e.target.value);
    }

    setValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    setValue(propsValue);
  }, [propsValue]);

  return (
    <RadioGroupWrapper>
      {options.map((item) => {
        return (
          <label key={item.value}>
            <input type="checkbox" checked={value?.includes(item.value)} onChange={handleOnChange} value={item.value} />{' '}
            {item.label}
          </label>
        );
      })}
    </RadioGroupWrapper>
  );
}

interface AttributeResultProps {
  type: InnerAttributeType[keyof InnerAttributeType];
  options?: AttributeOption[];
  label?: string;
  value: string;
  required?: boolean;
  regexp?: string;
  maxLength?: number;
  defaultValue?: string | boolean;
  stringType?: StringType[keyof StringType];
  className?: string;
  name?: NamePath;
}

export function AttributeFormItem({
  type,
  options,
  label,
  value,
  defaultValue,
  required,
  regexp,
  maxLength,
  stringType,
  className,
  name,
}: AttributeResultProps) {
  const { error, form } = useContext(ValidateContext);
  let finalDefaultValue: string[] | string | boolean | undefined = defaultValue;
  const fullName = useMemo(() => name || ['attributes', value], [name, value]);
  const finalOptions = useMemo(() => {
    return (
      options?.map((item) => {
        return {
          label: item.key,
          value: item.value,
        };
      }) ?? []
    );
  }, [options]);

  const rules = useMemo(() => {
    const result: Rule[] = [];

    if (required) {
      result.push({ required: true, message: `${label}为不可为空` });
    }

    if (type === 'string') {
      if (stringType === 'number') {
        result.push({ pattern: /^\d+$/, message: `${label}必须为数字` });
      }

      if (stringType === 'english') {
        result.push({ pattern: /^[a-zA-Z]+$/, message: `${label}必须为英文` });
      }

      if (stringType === 'regexp' && regexp) {
        result.push({ pattern: new RegExp(regexp), message: `${label}格式不正确（格式为：${regexp}）` });
      }
    }

    return result;
  }, [label, regexp, required, stringType, type]);

  let child: React.ReactNode = <input />;

  if (type === 'enum' || type === 'array') {
    if (!options || options.length === 0) {
      child = <div>no option</div>;
    } else {
      let defaultValues;

      for (let i = 0; i < options.length; i++) {
        if (options[i].isDefault) {
          if (typeof defaultValues === 'undefined') {
            defaultValues = [];
          }

          defaultValues.push(options[i].value);
        }
      }

      finalDefaultValue = defaultValues;
    }

    if (type === 'enum') {
      child = <RadioGroup options={finalOptions} />;
    } else {
      child = <CheckboxGroup options={finalOptions} />;
    }
  }

  if (type === 'string') {
    child = <textarea onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} maxLength={maxLength} />;

    if (stringType === 'order') {
      child = <input disabled />;
    }
  }

  const errors = useMemo(() => {
    if (!error.errorFields) {
      return [];
    }

    for (let i = 0; i < error.errorFields.length; i++) {
      if (error.errorFields[i].name[1] === value) {
        return error.errorFields[i].errors;
      }
    }
  }, [error.errorFields, value]);

  useEffect(() => {
    if (!form) {
      return;
    }

    if (typeof finalDefaultValue !== 'undefined' && finalDefaultValue !== '' && !form.getFieldValue(fullName)) {
      form.setFieldValue(fullName, finalDefaultValue);
    }
  }, [finalDefaultValue, form, fullName]);

  return (
    <FormItem label={label} required={required} errors={errors} className={className}>
      <Field key={value} name={fullName} rules={rules}>
        {child}
      </Field>
    </FormItem>
  );
}

export interface AttributeFormProps {
  onAttributeChange: (values: any) => void;
  attributes?: Attribute[];
  initialValues?: any;
  labelChangeable?: boolean;
  onLabelChange?: (attribute: Attribute) => void;
  currentAttribute?: Attribute;
  extra?: React.ReactNode;
}

export const AttributeForm = forwardRef<ValidationContextType, AttributeFormProps>(
  ({ onAttributeChange, labelChangeable = true, attributes, currentAttribute, initialValues, onLabelChange }, ref) => {
    const [form] = useForm();
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute>();
    const [error, setError] = useState<ValidateErrorEntity>({} as ValidateErrorEntity);
    const attributeMapping = useMemo(() => {
      const mapping: Record<string, Attribute> = {};

      if (attributes) {
        attributes.reduce((acc, cur) => {
          acc[cur.value] = cur;
          return acc;
        }, mapping);
      }

      return mapping;
    }, [attributes]);

    useEffect(() => {
      setSelectedAttribute(currentAttribute);
    }, [currentAttribute]);

    const resultAttributeOptions = useMemo(() => {
      return Array.from(selectedAttribute?.attributes ?? []);
    }, [selectedAttribute?.attributes]);

    const attributeOptions = useMemo(() => {
      const options: FieldOption[] = [];

      if (!attributes) {
        return options;
      }

      attributes?.forEach((item) => {
        options.push({
          label: item.key,
          value: item.value,
        });
      });

      return options;
    }, [attributes]);

    const handleAttributeChange = useCallback(
      async (changedValues: any) => {
        if ('label' in changedValues) {
          setSelectedAttribute(attributeMapping[changedValues.label]);
          onLabelChange?.(attributeMapping[changedValues.label]);
        }
      },
      [attributeMapping, onLabelChange],
    );

    const submit = useCallback(async () => {
      try {
        await form.validateFields();
        form.submit();
      } catch (_error: any) {
        setError(_error);

        return Promise.reject(_error);
      }
    }, [form]);

    useEffect(() => {
      form.resetFields();

      form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    const contextValue = useMemo(() => {
      return {
        error,
        submit,
      };
    }, [error, submit]);

    useImperativeHandle(ref, () => contextValue);

    return (
      <ValidateContext.Provider value={contextValue}>
        <Form form={form} autoComplete="off" onValuesChange={handleAttributeChange} onFinish={onAttributeChange}>
          {labelChangeable && (
            <FormItem label="标签" required>
              <Field
                name="label"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <select>
                  {attributeOptions.map((item) => {
                    return (
                      <option key={item.value} value={item.value!}>
                        {item.label}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </FormItem>
          )}
          {labelChangeable && resultAttributeOptions && resultAttributeOptions.length > 0 && <div>属性</div>}
          {Array.isArray(resultAttributeOptions) &&
            resultAttributeOptions.map((attributeOptionItem) => (
              <AttributeFormItem
                {...attributeOptionItem}
                label={attributeOptionItem.key}
                key={attributeOptionItem.value}
              />
            ))}
        </Form>
      </ValidateContext.Provider>
    );
  },
);
