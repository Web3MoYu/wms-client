import React, { useState } from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { Stock } from '../../../api/stock-service/StockController';
import { updateStock } from '../../../api/stock-service/StockController';

interface QuantityEditProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stock: Stock | null;
}

const StockQuantityEdit: React.FC<QuantityEditProps> = ({
  visible,
  onClose,
  onSuccess,
  stock
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 在Modal显示时重置表单
  React.useEffect(() => {
    if (visible && stock) {
      form.setFieldsValue({
        quantity: stock.quantity,
        availableQuantity: stock.availableQuantity
      });
    }
  }, [visible, stock, form]);

  // 处理表单字段值变化，重新触发相关字段校验
  const handleValuesChange = (changedValues: any) => {
    // 如果数量或可用数量变化，需要重新验证另一个字段
    if ('quantity' in changedValues) {
      form.validateFields(['availableQuantity']).catch(() => {});
    }
    if ('availableQuantity' in changedValues) {
      form.validateFields(['quantity']).catch(() => {});
    }
  };

  const handleSubmit = async () => {
    if (!stock) return;
    
    try {
      const values = await form.validateFields();
      
      // 额外验证：确保总数量不小于可用数量
      if (values.quantity < values.availableQuantity) {
        message.error('总数量不能小于可用数量');
        return;
      }
      
      setSubmitting(true);
      
      // 创建更新对象
      const updateData: Partial<Stock> = {
        id: stock.id,
        quantity: values.quantity,
        availableQuantity: values.availableQuantity,
        // 添加其他必需字段但保持原值
        productId: stock.productId,
        productCode: stock.productCode,
        alertStatus: stock.alertStatus,
        areaId: stock.areaId,
        batchNumber: stock.batchNumber,
        location: stock.location,
        productionDate: stock.productionDate
      };
      
      // 更新库存
      const res = await updateStock(updateData as Stock);
      if (res.code === 200) {
        message.success('更新数量成功');
        onSuccess();
        onClose();
      } else {
        message.error(res.msg || '更新数量失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error(`表单验证失败: ${error.errorFields[0]?.errors[0]}`);
      } else {
        message.error('提交失败，请检查表单');
      }
      console.error('提交表单出错:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="编辑数量"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="quantity"
          label="数量"
          rules={[
            { required: true, message: '请输入数量' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const availableQty = getFieldValue('availableQuantity');
                if (availableQty !== undefined && value < availableQty) {
                  return Promise.reject(new Error('总数量不能小于可用数量'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={0} 
            precision={0}
          />
        </Form.Item>
        
        <Form.Item
          name="availableQuantity"
          label="可用数量"
          rules={[
            { required: true, message: '请输入可用数量' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value > getFieldValue('quantity')) {
                  return Promise.reject(new Error('可用数量不能大于总数量'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={0} 
            precision={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StockQuantityEdit; 