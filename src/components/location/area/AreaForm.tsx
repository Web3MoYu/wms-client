import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Radio,
  Row,
  Col,
} from 'antd';
import { Area, checkAreaCode, checkAreaName } from '../../../api/location-service/AreaController';
import { User } from '../../../api/sys-service/UserController';

const { Option } = Select;
const { TextArea } = Input;

interface AreaFormProps {
  initialValues?: Partial<Area>;
  onFinish: (values: any) => void;
  onCancel: () => void;
  adminOptions: User[];
  loading: boolean;
  isEdit: boolean;
}

const AreaForm: React.FC<AreaFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  adminOptions,
  loading,
  isEdit
}) => {
  const [form] = Form.useForm();

  // 初始化表单数据
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
      });
    }
  }, [initialValues, form]);

  // 校验区域名称唯一性
  const validateAreaName = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    // 如果是编辑模式且名称未改变，不需要验证
    if (isEdit && initialValues?.areaName === value) {
      return Promise.resolve();
    }
    
    try {
      const result = await checkAreaName(value);
      if (result.code === 200) {
        if (result.data) {
          return Promise.reject(new Error('区域名称已存在，请更换名称'));
        }
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(result.msg || '验证区域名称失败'));
      }
    } catch (error) {
      console.error('验证区域名称出错:', error);
      return Promise.reject(new Error('验证区域名称失败'));
    }
  };

  // 校验区域编码唯一性
  const validateAreaCode = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    // 如果是编辑模式且编码未改变，不需要验证
    if (isEdit && initialValues?.areaCode === value) {
      return Promise.resolve();
    }
    
    try {
      const result = await checkAreaCode(value);
      if (result.code === 200) {
        // 如果返回的字符串不为空，表示编码已存在（返回的是已存在的区域ID）
        if (result.data) {
          return Promise.reject(new Error('区域编码已存在，请更换编码'));
        }
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(result.msg || '验证区域编码失败'));
      }
    } catch (error) {
      console.error('验证区域编码出错:', error);
      return Promise.reject(new Error('验证区域编码失败'));
    }
  };

  // 表单布局
  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  return (
    <Form
      {...formItemLayout}
      form={form}
      onFinish={onFinish}
      name="areaForm"
      initialValues={{
        status: 1, // 默认启用
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="areaName"
            label="区域名称"
            rules={[
              { required: true, message: '请输入区域名称' },
              { validator: validateAreaName }
            ]}
          >
            <Input placeholder="请输入区域名称" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="areaCode"
            label="区域编码"
            rules={[
              { required: true, message: '请输入区域编码' },
              {
                pattern: /^[A-Za-z0-9-]{1,8}$/,
                message: '编码只能包含字母、数字和短横线，长度1-8位',
              },
              { validator: validateAreaCode }
            ]}
          >
            <Input placeholder="请输入区域编码" maxLength={20} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="areaManager"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {adminOptions.map(admin => (
                <Option key={admin.userId} value={admin.userId}>{admin.realName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="描述"
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
      >
        <TextArea rows={4} placeholder="请输入区域描述" maxLength={500} />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 11, span: 13 }}>
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
          {isEdit ? '更新' : '保存'}
        </Button>
        <Button onClick={onCancel}>取消</Button>
      </Form.Item>
    </Form>
  );
};

export default AreaForm; 