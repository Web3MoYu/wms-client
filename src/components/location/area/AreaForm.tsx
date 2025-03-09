import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Radio,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import { AreaDto, checkAreaCode, checkAreaName } from '../../../api/location-service/AreaController';
import { User } from '../../../api/sys-service/UserController';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface AreaFormProps {
  initialValues?: Partial<AreaDto>;
  onFinish: (values: AreaDto) => void;
  onCancel: () => void;
  adminOptions: User[];
  userOptions: User[]; // 所有用户选项
  loading: boolean;
  isEdit: boolean;
  disabled?: boolean; // 是否禁用表单，用于查看详情
}

const AreaForm: React.FC<AreaFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  adminOptions,
  userOptions,
  loading,
  isEdit,
  disabled = false
}) => {
  const [form] = Form.useForm();
  const [selectedPrimaryUser, setSelectedPrimaryUser] = useState<string | undefined>(
    initialValues?.primaryUser?.userId
  );

  // 初始化表单数据
  useEffect(() => {
    if (initialValues) {
      // 准备表单数据
      const formData = {
        ...initialValues,
        // 如果有主要负责人，设置ID
        primaryUser: initialValues.primaryUser?.userId,
        // 如果有次要负责人，设置ID数组
        secondaryUsers: initialValues.secondaryUsers?.map(user => user.userId) || [],
      };

      form.setFieldsValue(formData);
      
      // 更新选中的主要负责人状态
      if (formData.primaryUser) {
        setSelectedPrimaryUser(formData.primaryUser);
      }
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
        if (result.data === true) {
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
        if (result.data && result.data !== '') {
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

  // 处理主要负责人选择变化
  const handlePrimaryUserChange = (value: string) => {
    setSelectedPrimaryUser(value);
    // 当主要负责人变化时，检查次要负责人是否包含此用户，如果有则移除
    const secondaryUsers = form.getFieldValue('secondaryUsers') || [];
    if (secondaryUsers.includes(value)) {
      form.setFieldsValue({
        secondaryUsers: secondaryUsers.filter((id: string) => id !== value)
      });
    }
  };

  // 表单布局
  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  // 处理表单提交，转换数据为 AreaDto 格式
  const handleFinish = (values: any) => {
    // 构建 AreaDto 对象
    const areaDto: AreaDto = {
      ...values,
      // 处理主要负责人
      primaryUser: userOptions.find(user => user.userId === values.primaryUser) as User,
      // 处理次要负责人数组
      secondaryUsers: (values.secondaryUsers || []).map((userId: string) => 
        userOptions.find(user => user.userId === userId)
      ).filter(Boolean),
    };
    
    onFinish(areaDto);
  };

  // 过滤用户选项，已选为主要负责人的不再显示在次要负责人选项中
  const filteredSecondaryOptions = userOptions.filter(
    user => user.userId !== selectedPrimaryUser
  );

  return (
    <Form
      {...formItemLayout}
      form={form}
      onFinish={handleFinish}
      name="areaForm"
      initialValues={{
        status: 1, // 默认启用
      }}
      disabled={disabled}
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
                pattern: /^[A-Za-z0-9-]{1,20}$/,
                message: '编码只能包含字母、数字和短横线，长度1-20位',
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

      <Divider />
      <Title level={5}>质检员信息</Title>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="primaryUser"
            label="主要质检员"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 21 }}
            rules={[{ required: true, message: '请选择主要质检员' }]}
          >
            <Select
              placeholder="请选择主要质检员"
              onChange={handlePrimaryUserChange}
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) => 
                (option?.label as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {userOptions.map(user => (
                <Option 
                  key={user.userId} 
                  value={user.userId}
                  label={user.realName}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{user.realName}</span>
                    <span style={{ color: '#999' }}>{user.phone}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="secondaryUsers"
            label="次要质检员"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 21 }}
          >
            <Select
              mode="multiple"
              placeholder="请选择次要质检员"
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) => 
                (option?.label as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {filteredSecondaryOptions.map(user => (
                <Option 
                  key={user.userId} 
                  value={user.userId}
                  label={user.realName}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{user.realName}</span>
                    <span style={{ color: '#999' }}>{user.phone}</span>
                  </div>
                </Option>
              ))}
            </Select>
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

      {!disabled && (
        <Form.Item wrapperCol={{ offset: 11, span: 13 }}>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
            {isEdit ? '更新' : '保存'}
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default AreaForm; 