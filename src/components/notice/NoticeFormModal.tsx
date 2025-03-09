import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import {
  Notice,
  add,
  updateNotice,
} from '../../api/msg-service/NoticeController';
import { Result } from '../../api/Model';
import TextArea from 'antd/lib/input/TextArea';

// 优先级常量
const PRIORITY_OPTIONS = [
  { value: 0, label: '普通' },
  { value: 1, label: '重要' },
  { value: 2, label: '紧急' },
];

// 置顶常量
const IS_TOP_OPTIONS = [
  { value: 0, label: '不置顶' },
  { value: 1, label: '置顶' },
];

interface NoticeFormModalProps {
  visible: boolean;
  notice: Partial<Notice> | null;
  mode: 'add' | 'edit';
  onClose: () => void;
  onSuccess: () => void;
}

const NoticeFormModal: React.FC<NoticeFormModalProps> = ({
  visible,
  notice,
  mode,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && notice) {
      form.setFieldsValue({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        isTop: notice.isTop,
      });
    } else {
      form.resetFields();
    }
  }, [visible, notice, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let result: Result<string>;

      if (mode === 'edit' && notice?.id) {
        // 编辑模式
        result = await updateNotice(notice.id.toString(), values as Notice);
      } else {
        // 新增模式
        result = await add(values as Notice);
      }

      setLoading(false);
      
      if (result.code === 200) {
        message.success(result.msg || `${mode === 'add' ? '添加' : '编辑'}公告成功`);
        onSuccess();
        onClose();
      } else {
        message.error(result.msg || `${mode === 'add' ? '添加' : '编辑'}公告失败`);
      }
    } catch (error) {
      setLoading(false);
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={`${mode === 'add' ? '添加' : '编辑'}公告`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          确定
        </Button>
      ]}
      width={900}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入公告标题' }]}
        >
          <Input placeholder="请输入公告标题" maxLength={50} />
        </Form.Item>
        
        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入公告内容' }]}
        >
          <TextArea 
            placeholder="请输入公告内容" 
            rows={12} 
            maxLength={500} 
            style={{ resize: 'vertical', minHeight: '200px' }}
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select
            placeholder="请选择优先级"
            options={PRIORITY_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          name="isTop"
          label="是否置顶"
          rules={[{ required: true, message: '请选择是否置顶' }]}
        >
          <Select
            placeholder="请选择是否置顶"
            options={IS_TOP_OPTIONS}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NoticeFormModal;
