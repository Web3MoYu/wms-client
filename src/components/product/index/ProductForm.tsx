import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Cascader,
  Button,
  Row,
  Col,
} from 'antd';
import { checkProductCode, Product } from '../../../api/product-service/ProductController';

interface ProductFormProps {
  initialValues?: Partial<Product>;
  onFinish: (values: any) => void;
  onCancel: () => void;
  categoryOptions: any[];
  loading: boolean;
  isEdit: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  categoryOptions,
  loading,
  isEdit
}) => {
  const [form] = Form.useForm();

  // 初始化表单数据
  useEffect(() => {
    if (initialValues) {
      // 处理级联选择器值，如果已选择分类ID，需要查找完整的级联路径
      const categoryId = initialValues.categoryId;
      
      // 先设置除分类外的其他表单值
      form.setFieldsValue({
        ...initialValues,
        price: initialValues.price ? parseFloat(initialValues.price) : undefined,
      });
      
      // 如果有分类ID，查找并设置完整的级联路径
      if (categoryId && categoryOptions.length > 0) {
        findCascaderPath(categoryOptions, categoryId, []);
      }
    }
  }, [initialValues, form, categoryOptions]);

  // 递归查找级联选择器的完整路径
  const findCascaderPath = (
    options: any[],
    targetValue: string,
    path: string[]
  ): string[] | null => {
    // 如果没有传入有效选项或目标值，则返回 null
    if (!options || !options.length || !targetValue) {
      return null;
    }
    
    for (const option of options) {
      // 创建当前路径
      const currentPath = [...path, option.value];
      
      // 如果找到目标值
      if (option.value === targetValue) {
        // 找到匹配的路径，设置表单值
        form.setFieldsValue({ categoryId: currentPath });
        return currentPath;
      }
      
      // 如果有子节点，递归查找
      if (option.children && option.children.length > 0) {
        const found = findCascaderPath(option.children, targetValue, currentPath);
        if (found) return found;
      }
    }
    
    // 未找到匹配的路径
    return null;
  };

  // 校验产品编码唯一性
  const validateProductCode = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    // 如果是编辑模式且编码未改变，不需要验证
    if (isEdit && initialValues?.productCode === value) {
      return Promise.resolve();
    }
    
    try {
      const result = await checkProductCode(value);
      if (result.code === 200) {
        if (result.data) {
          return Promise.reject(new Error('产品编码已存在，请更换编码'));
        }
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(result.msg || '验证产品编码失败'));
      }
    } catch (error) {
      console.error('验证产品编码出错:', error);
      return Promise.reject(new Error('验证产品编码失败'));
    }
  };

  // 表单提交处理
  const handleFinish = (values: any) => {
    // 处理级联选择器的值，取最后一级
    const formData = { ...values };
    if (formData.categoryId && Array.isArray(formData.categoryId)) {
      formData.categoryId = formData.categoryId[formData.categoryId.length - 1];
    } else if (!formData.categoryId) {
      // 如果分类为空，设置为空字符串
      formData.categoryId = '';
    }
    
    onFinish(formData);
  };

  // 自定义级联选择器显示
  const displayRender = (labels: string[]) => {
    return labels.join('-');
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
      name="productForm"
      initialValues={{
        minStock: 0,
        maxStock: 999,
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="productName"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="productCode"
            label="产品编码"
            rules={[
              { required: true, message: '请输入产品编码' },
              {
                pattern: /^[A-Za-z0-9_-]{2,20}$/,
                message: '编码只能包含字母、数字、下划线、短横线，长度2-20位',
              },
              { validator: validateProductCode }
            ]}
          >
            <Input placeholder="请输入产品编码" maxLength={20} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="categoryId"
            label="产品分类"
          >
            <Cascader
              options={categoryOptions}
              placeholder="请选择产品分类"
              changeOnSelect
              expandTrigger="hover"
              displayRender={displayRender}
              showSearch={{
                filter: (inputValue, path) => {
                  return path.some(option => 
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                  );
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="brand"
            label="品牌"
            rules={[{ required: true, message: '请输入品牌' }]}
          >
            <Input placeholder="请输入品牌" maxLength={30} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="model"
            label="型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="请输入型号" maxLength={30} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="spec"
            label="规格"
          >
            <Input placeholder="请输入规格" maxLength={100} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="请输入价格"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="minStock"
            label="最小库存"
            rules={[{ required: true, message: '请输入最小库存' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
              placeholder="请输入最小库存"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="maxStock"
            label="最大库存"
            rules={[{ required: true, message: '请输入最大库存' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
              placeholder="请输入最大库存"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="描述"
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
      >
        <Input.TextArea rows={4} placeholder="请输入产品描述" maxLength={500} />
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

export default ProductForm; 