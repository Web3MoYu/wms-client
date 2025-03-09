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
  message,
} from 'antd';
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
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

// 质检员数据结构
interface InspectorData {
  key: string;
  userId: string;
  isPrimary: number; // 1 - 主要, 0 - 次要
  phone: string; // 手机号，自动填充
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
  const [inspectors, setInspectors] = useState<InspectorData[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // 初始化表单数据
  useEffect(() => {
    if (initialValues) {
      // 准备表单数据（基础字段部分保持不变）
      form.setFieldsValue({
        ...initialValues,
      });
      
      // 初始化质检员数据
      const inspectorsData: InspectorData[] = [];
      const selectedIds: string[] = [];
      
      // 处理主要质检员
      if (initialValues.primaryUser) {
        inspectorsData.push({
          key: `primary-${initialValues.primaryUser.userId}`,
          userId: initialValues.primaryUser.userId,
          isPrimary: 1,
          phone: initialValues.primaryUser.phone || ''
        });
        selectedIds.push(initialValues.primaryUser.userId);
      }
      
      // 处理次要质检员
      if (initialValues.secondaryUsers && initialValues.secondaryUsers.length > 0) {
        initialValues.secondaryUsers.forEach(user => {
          inspectorsData.push({
            key: `secondary-${user.userId}`,
            userId: user.userId,
            isPrimary: 0,
            phone: user.phone || ''
          });
          selectedIds.push(user.userId);
        });
      }
      
      setInspectors(inspectorsData);
      setSelectedUserIds(selectedIds);
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

  // 添加质检员行
  const addInspectorRow = () => {
    const newInspector: InspectorData = {
      key: `new-${Date.now()}`,
      userId: '',
      isPrimary: inspectors.some(i => i.isPrimary === 1) ? 0 : 1, // 如果已有主要质检员，则新增为次要质检员
      phone: ''
    };
    
    setInspectors([...inspectors, newInspector]);
  };
  
  // 删除质检员行
  const removeInspectorRow = (key: string) => {
    const updatedInspectors = inspectors.filter(item => item.key !== key);
    const inspector = inspectors.find(item => item.key === key);
    
    if (inspector && inspector.userId) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== inspector.userId));
    }
    
    // 如果删除了主要质检员，需要更新其他质检员
    if (inspector && inspector.isPrimary === 1 && updatedInspectors.length > 0) {
      // 把第一个次要质检员设为主要质检员
      updatedInspectors[0].isPrimary = 1;
    }
    
    setInspectors(updatedInspectors);
  };
  
  // 质检员类型变更处理
  const handleInspectorTypeChange = (key: string, isPrimary: number) => {
    // 如果设置为主要质检员，需要把其他所有质检员设为次要质检员
    if (isPrimary === 1) {
      const updatedInspectors = inspectors.map(item => ({
        ...item,
        isPrimary: item.key === key ? 1 : 0
      }));
      setInspectors(updatedInspectors);
    } else {
      // 如果变更为次要质检员，但当前没有其他主要质检员，不允许变更
      if (!inspectors.some(i => i.isPrimary === 1 && i.key !== key)) {
        message.warning('必须至少有一个主要质检员');
        return;
      }
      
      const updatedInspectors = inspectors.map(item => ({
        ...item,
        isPrimary: item.key === key ? 0 : item.isPrimary
      }));
      setInspectors(updatedInspectors);
    }
  };
  
  // 质检员选择处理
  const handleInspectorChange = (key: string, userId: string) => {
    const inspector = inspectors.find(item => item.key === key);
    const oldUserId = inspector ? inspector.userId : '';
    
    // 创建新的已选用户ID数组
    let newSelectedUserIds = [...selectedUserIds];
    
    // 如果之前有选择，需要从已选列表中移除旧的ID
    if (oldUserId) {
      // 检查其他质检员是否也使用了这个ID
      const isUsedElsewhere = inspectors.some(item => 
        item.key !== key && item.userId === oldUserId
      );
      
      // 只有当其他地方没有使用这个ID时，才从已选列表中移除
      if (!isUsedElsewhere) {
        newSelectedUserIds = newSelectedUserIds.filter(id => id !== oldUserId);
      }
    }
    
    // 添加新选择到已选列表（如果不为空）
    if (userId) {
      // 确保ID不重复添加
      if (!newSelectedUserIds.includes(userId)) {
        newSelectedUserIds.push(userId);
      }
    }
    
    setSelectedUserIds(newSelectedUserIds);
    
    // 查找选中用户的手机号
    const selectedUser = userOptions.find(user => user.userId === userId);
    const phone = selectedUser ? selectedUser.phone || '' : '';
    
    // 更新质检员数据
    const updatedInspectors = inspectors.map(item => {
      if (item.key === key) {
        return { ...item, userId, phone };
      }
      return item;
    });
    
    setInspectors(updatedInspectors);
  };

  // 提交处理，转换数据为 AreaDto 格式
  const handleFinish = (values: any) => {
    // 验证是否至少有一个主要质检员
    if (!inspectors.some(i => i.isPrimary === 1 && i.userId)) {
      message.error('请至少选择一个主要质检员');
      return;
    }
    
    // 构建 AreaDto 对象
    const areaDto: AreaDto = {
      ...values,
      // 处理主要质检员
      primaryUser: (() => {
        const primary = inspectors.find(i => i.isPrimary === 1 && i.userId);
        return primary ? userOptions.find(user => user.userId === primary.userId) : undefined;
      })() as User,
      
      // 处理次要质检员数组
      secondaryUsers: inspectors
        .filter(i => i.isPrimary === 0 && i.userId)
        .map(i => userOptions.find(user => user.userId === i.userId))
        .filter(Boolean) as User[],
    };
    
    onFinish(areaDto);
  };

  // 获取用户选项，过滤掉已选的用户
  const getFilteredUserOptions = (currentKey: string) => {
    const currentInspector = inspectors.find(i => i.key === currentKey);
    return userOptions.filter(
      user => !selectedUserIds.includes(user.userId) || 
              (currentInspector && currentInspector.userId === user.userId)
    );
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
      onFinish={handleFinish}
      name="areaForm"
      initialValues={{
        status: 1, // 默认启用
      }}
      disabled={disabled}
    >
      <Divider style={{ margin: '8px 0 16px' }} />
      <Title level={5} style={{ marginBottom: 16 }}>基本信息</Title>
      
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
            <Select 
              placeholder="请选择负责人"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => 
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
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

      {/* 区域描述部分 - 移到基本信息和质检员信息之间 */}
      <Form.Item
        name="description"
        label="区域描述"
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        style={{ marginBottom: 24, marginTop: 8 }}
      >
        <TextArea rows={4} placeholder="请输入区域描述" maxLength={500} />
      </Form.Item>

      <Divider style={{ margin: '24px 0 16px' }} />
      <Title level={5} style={{ marginBottom: 16 }}>质检员信息</Title>

      {/* 质检员动态行编辑 */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '16px 8px 8px', borderRadius: '4px', marginBottom: '16px' }}>
        {inspectors.map((inspector) => (
          <Row gutter={16} key={inspector.key} style={{ marginBottom: 16 }}>
            <Col span={7}>
              <Select
                placeholder="请选择质检员"
                style={{ width: '100%' }}
                value={inspector.userId || undefined}
                onChange={(value) => handleInspectorChange(inspector.key, value)}
                disabled={disabled}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => 
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {getFilteredUserOptions(inspector.key).map(user => (
                  <Option key={user.userId} value={user.userId}>
                    {user.realName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={5}>
              <Select
                placeholder="类型"
                style={{ width: '100%' }}
                value={inspector.isPrimary}
                onChange={(value) => handleInspectorTypeChange(inspector.key, value as number)}
                disabled={disabled}
              >
                <Option value={1}>主要质检员</Option>
                <Option value={0}>次要质检员</Option>
              </Select>
            </Col>
            <Col span={10}>
              <Input
                placeholder="手机号"
                value={inspector.phone}
                disabled={true} // 手机号不可编辑
                style={{ color: 'rgba(0, 0, 0, 0.65)' }} // 保持文本可见性
              />
            </Col>
            <Col span={2} style={{ textAlign: 'right' }}>
              {!disabled && (
                <Button 
                  type="link" 
                  danger 
                  icon={<CloseCircleOutlined />} 
                  onClick={() => removeInspectorRow(inspector.key)}
                >
                  删除
                </Button>
              )}
            </Col>
          </Row>
        ))}

        {!disabled && (
          <Row style={{ marginTop: 8 }}>
            <Col span={24}>
              <Button 
                type="dashed" 
                onClick={addInspectorRow} 
                style={{ width: '100%' }} 
                icon={<PlusOutlined />}
              >
                添加质检员
              </Button>
            </Col>
          </Row>
        )}
      </div>

      {!disabled && (
        <Form.Item wrapperCol={{ offset: 11, span: 13 }} style={{ marginTop: 24 }}>
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