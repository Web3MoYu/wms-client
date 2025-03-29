import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Alert, Space } from 'antd';
import { Area } from '../../../api/location-service/AreaController';
import { Shelf } from '../../../api/location-service/ShelfController';
import { StorageVo } from '../../../api/location-service/StorageController';
import {
  searchProducts,
  Product,
} from '../../../api/product-service/ProductController';
import debounce from 'lodash/debounce';

const { Option } = Select;

interface StorageFormProps {
  form: any;
  areaList: Area[];
  shelfList: Shelf[];
  editingStorage: StorageVo | null;
  validateLocationCode: (rule: any, value: string) => Promise<void>;
  onAreaChange: (areaId: string) => void;
  onShelfChange: (shelfId: string) => void;
  areaCode: string;
  shelfCode: string;
}

const StorageForm: React.FC<StorageFormProps> = ({
  form,
  areaList,
  shelfList,
  editingStorage,
  validateLocationCode,
  onAreaChange,
  onShelfChange,
  areaCode,
  shelfCode,
}) => {
  const [locationCodePrefix, setLocationCodePrefix] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [hasProduct, setHasProduct] = useState<boolean>(!!editingStorage?.productId);

  // 当区域代码或货架代码变化时，更新库位代码前缀
  useEffect(() => {
    if (editingStorage) {
      setProducts([
        {
          id: editingStorage.productId,
          productName: editingStorage.productName,
          productCode: '',
          categoryId: '',
          brand: '',
          model: '',
          spec: '',
          price: '',
          minStock: 0,
          maxStock: 0,
          imageUrl: '',
          description: '',
          createTime: '',
          updateTime: '',
        },
      ]);
      setHasProduct(!!editingStorage.productId);
    }
    if (areaCode && shelfCode) {
      setLocationCodePrefix(`${areaCode}-${shelfCode}-`);

      // 设置自动生成的库位名称
      const locationCode = form.getFieldValue('locationCode');
      if (locationCode) {
        form.setFieldsValue({
          locationName: `${areaCode}-${shelfCode}-${locationCode}`,
        });
      }
    }
  }, [areaCode, shelfCode, form, editingStorage]);

  // 当选择产品变化时，自动设置状态为占用
  useEffect(() => {
    const productId = form.getFieldValue('productId');
    setHasProduct(!!productId);
    
    if (productId) {
      // 如果选择了产品，自动设置状态为占用(0)
      form.setFieldsValue({
        status: 0,
      });
    }
  }, [form.getFieldValue('productId')]);

  // 监听产品选择变化
  const handleProductChange = (value: string) => {
    setHasProduct(!!value);
    // 如果选择了产品，自动设置状态为占用
    if (value) {
      form.setFieldsValue({
        status: 0,
      });
    }
  };

  // 当库位编码变化时，自动更新库位名称
  const handleLocationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    if (code && areaCode && shelfCode) {
      form.setFieldsValue({
        locationName: `${areaCode}-${shelfCode}-${code}`,
      });
    }
  };

  // 模糊搜索产品
  const handleProductSearch = debounce(async (productName: string) => {
    if (!productName || productName.length < 1) {
      setProducts([]);
      return;
    }

    try {
      const res = await searchProducts(productName);
      if (res.code === 200) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('搜索产品失败', error);
    }
  }, 500);

  return (
    <Form form={form} layout='vertical' requiredMark='optional'>
      <Alert
        message='所有带 * 的字段均为必填项。库位名称将根据区域编码、货架编码和库位编码自动生成。'
        type='info'
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name='areaId'
        label={
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>所属区域
          </Space>
        }
        rules={[{ required: true, message: '请选择所属区域' }]}
      >
        <Select placeholder='请选择区域' onChange={onAreaChange}>
          {areaList.map((area) => (
            <Option key={area.id} value={area.id}>
              {area.areaName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name='shelfId'
        label={
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>所属货架
          </Space>
        }
        rules={[{ required: true, message: '请选择所属货架' }]}
      >
        <Select
          placeholder='请选择货架'
          disabled={!form.getFieldValue('areaId')}
          onChange={onShelfChange}
        >
          {shelfList.map((shelf) => (
            <Option key={shelf.id} value={shelf.id}>
              {shelf.shelfName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name='locationCode'
        label={
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>库位编码
          </Space>
        }
        rules={[
          { required: true, message: '请输入库位编码' },
          { validator: validateLocationCode },
        ]}
        tooltip='编码将与区域和货架编码组合形成完整的库位编码'
      >
        <Input
          placeholder='请输入库位编码'
          onChange={handleLocationCodeChange}
          addonBefore={locationCodePrefix || '请先选择区域和货架'}
        />
      </Form.Item>

      <Form.Item
        name='locationName'
        label='库位名称'
        tooltip='库位名称会自动生成，无需手动输入'
      >
        <Input disabled placeholder='自动生成的库位名称' />
      </Form.Item>

      <Form.Item
        name='productId'
        label='产品'
        tooltip='选择库位存放的产品，可选填'
      >
        <Select
          placeholder='请输入产品名称搜索'
          allowClear
          showSearch
          defaultValue={editingStorage?.productId}
          filterOption={false}
          onSearch={handleProductSearch}
          onChange={handleProductChange}
          disabled={!!editingStorage}
        >
          {products.map((product) => (
            <Option key={product.id} value={product.id}>
              {product.productName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name='status'
        label='状态'
        initialValue={1}
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select placeholder='请选择状态' disabled={editingStorage?.status === 0 || hasProduct}>
          <Option value={1}>空闲</Option>
          <Option value={0}>占用</Option>
          <Option value={2}>禁用</Option>
        </Select>
      </Form.Item>
    </Form>
  );
};

export default StorageForm;
