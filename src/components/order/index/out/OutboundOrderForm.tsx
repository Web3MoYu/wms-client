import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Typography,
  Row,
  Col,
  Empty,
  message,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { FormInstance } from 'antd/lib/form';
import { User } from '../../../../api/sys-service/UserController';
import StockSelectDrawer from './StockSelectDrawer';
import { StockVo } from '../../../../api/stock-service/StockController';
import userStore from '../../../../store/userStore';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 选择的库存数据结构，增加了expectedQuantity字段
interface SelectedStock extends StockVo {
  expectedQuantity: number;
  price?: number; // 添加价格字段
}

// 定义提交所需的数据结构
export interface OutboundOrderData {
  order: {
    orderType: number;
    expectedTime: string;
    creator: string;
    approver: string;
    deliveryAddress: string;
    contactName: string;
    contactPhone: string;
    remark: string;
    totalAmount: number;
    totalQuantity: number;
  };
  orderItems: {
    productId: string;
    stockId: string;
    expectedQuantity: number;
    price: number;
    batchNumber: string;
    remark: string;
  }[];
}

interface OutboundOrderFormProps {
  form: FormInstance;
  approverOptions: User[];
  productOptions: any[];
  batchNumberOptions: string[];
  currentUserId: string;
  handleApproverSearch: (name: string) => void;
  handleProductSearch: (productName: string) => void;
  handleProductSelect: (
    productId: string,
    index: number,
    formName: string
  ) => void;
  handleQuantityOrPriceChange: (index: number, formName: string) => void;
  handleBatchNumberSearch: (
    batchNumber: string,
    index: number,
    formName: string
  ) => void;
  generateBatchNumber?: (index: number, formName: string) => void;
  calculateTotals: (formName: string) => {
    totalAmount: number;
    totalQuantity: number;
  };
  generateId: () => string;
  visible?: boolean; // 是否可见，用于监听标签页切换
  // 添加ref回调方法，用于父组件调用
  onGetOrderData?: (callback: () => Promise<OutboundOrderData | null>) => void;
}

const OutboundOrderForm: React.FC<OutboundOrderFormProps> = ({
  form,
  approverOptions,
  calculateTotals,
  generateId,
  handleApproverSearch,
  handleQuantityOrPriceChange,
  visible,
  onGetOrderData,
}) => {
  const user = new userStore();
  const { totalAmount, totalQuantity } = calculateTotals('outbound');

  // 添加库存选择抽屉的状态控制
  const [stockDrawerVisible, setStockDrawerVisible] = useState(false);

  // 定义验证和收集数据的方法，供父组件调用
  const validateAndGetOrderData =
    async (): Promise<OutboundOrderData | null> => {
      try {
        // 表单校验
        await form.validateFields();

        // 获取表单数据
        const values = form.getFieldsValue();

        // 校验是否有商品
        if (!values.orderItems || values.orderItems.length === 0) {
          message.error('请至少添加一个商品');
          return null;
        }

        // 计算总量和总金额
        const { totalAmount, totalQuantity } = calculateTotals('outbound');

        // 构造出库订单对象
        const order = {
          orderType: values.orderType,
          expectedTime: values.expectedTime?.format('YYYY-MM-DD HH:mm:ss'),
          creator: user.user.userId,
          approver: values.approverId,
          deliveryAddress: values.deliveryAddress,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          remark: values.remark || '',
          totalAmount,
          totalQuantity,
        };

        // 构造订单明细
        const orderItems = values.orderItems.map((item: any) => ({
          productId: item.productId,
          stockId: item.stockId,
          expectedQuantity: item.expectedQuantity,
          price: item.price,
          batchNumber: item.batchNumber,
          remark: item.remark || '',
        }));

        // 返回完整的订单数据
        return {
          order,
          orderItems,
        };
      } catch (error) {
        console.error('出库订单数据验证错误:', error);
        message.error('表单校验失败，请检查必填项');
        return null;
      }
    };

  // 将验证方法提供给父组件
  useEffect(() => {
    if (onGetOrderData) {
      onGetOrderData(validateAndGetOrderData);
    }
  }, [onGetOrderData]);

  // 当可见性变化时，重置表单
  useEffect(() => {
    if (visible) {
      // 保留创建人字段值
      const creatorId = form.getFieldValue('creatorId');
      // 重置表单
      form.resetFields();
      // 保留创建人信息
      if (creatorId) {
        form.setFieldValue('creatorId', creatorId);
      }
      // 清空订单明细
      form.setFieldValue('orderItems', []);
    }
  }, [visible, form]);

  // 处理选择库存 - 直接覆盖表单中的订单项
  const handleSelectStocks = (selectedStocks: SelectedStock[]) => {
    if (!selectedStocks || selectedStocks.length === 0) return;

    // 将选择的库存映射为订单项
    const orderItems = selectedStocks.map((stock) => ({
      key: generateId(),
      productId: stock.productId,
      productName: stock.productName,
      productCode: stock.productCode,
      stockId: stock.id,
      expectedQuantity: stock.expectedQuantity,
      areaId: stock.areaId,
      areaName: stock.areaName,
      batchNumber: stock.batchNumber,
      price: stock.price || 0, // 使用从API获取的价格
      productionDate: stock.productionDate, // 直接使用字符串日期
      maxQuantity: stock.availableQuantity, // 保存最大可用数量
      amount: stock.expectedQuantity * (stock.price || 0), // 计算金额
      status: 0,
      qualityStatus: 0,
      remark: '',
    }));

    // 直接设置订单项，覆盖原有数据
    form.setFieldsValue({ orderItems });

    // 重新计算总金额和总数量
    calculateTotals('outbound');
  };

  // 打开库存选择抽屉
  const openStockDrawer = () => {
    setStockDrawerVisible(true);
  };

  return (
    <>
      <Form form={form} layout='vertical' requiredMark={true}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='orderType'
              label='订单类型'
              rules={[{ required: true, message: '请选择订单类型' }]}
            >
              <Select placeholder='请选择订单类型'>
                <Option value={1}>销售出库</Option>
                <Option value={2}>调拨出库</Option>
                <Option value={3}>其他出库</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='expectedTime'
              label='预计出库时间'
              rules={[{ required: true, message: '请选择预计出库时间' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                locale={locale}
                showTime
                format='YYYY-MM-DD HH:mm:ss'
                defaultValue={null}
                disabledDate={(current) => {
                  // 只禁用今天之前的日期，允许选择今天及未来日期
                  return (
                    current &&
                    current.startOf('day').valueOf() < Date.now() - 8.64e7
                  ); // 减去一天的毫秒数
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name='creatorId'
              label='创建人'
              rules={[{ required: true, message: '请输入创建人' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name='approverId'
              label='审批人'
              rules={[{ required: true, message: '请选择审批人' }]}
            >
              <Select
                showSearch
                placeholder='请输入审批人姓名'
                filterOption={false}
                onSearch={handleApproverSearch}
                allowClear
              >
                {approverOptions.map((user) => (
                  <Option key={user.userId} value={user.userId}>
                    {user.realName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name='deliveryAddress'
              label='配送地址'
              rules={[{ required: true, message: '请输入配送地址' }]}
            >
              <TextArea rows={2} placeholder='请输入配送地址' />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='contactName'
              label='联系人'
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input placeholder='请输入联系人' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='contactPhone'
              label='联系电话'
              rules={[
                { required: true, message: '请输入联系电话' },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入正确的手机号码',
                },
              ]}
            >
              <Input placeholder='请输入联系电话' />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name='remark' label='备注'>
          <TextArea rows={2} placeholder='请输入备注信息' />
        </Form.Item>

        <Divider orientation='left'>订单明细</Divider>

        {/* 添加商品按钮 */}
        <Button
          type='dashed'
          onClick={openStockDrawer}
          icon={<PlusOutlined />}
          style={{ marginBottom: 16, width: '100%' }}
        >
          添加商品
        </Button>

        <Form.List name='orderItems'>
          {(fields, { remove }) => (
            <>
              {fields.length === 0 ? (
                <Empty description='暂无商品，请点击上方按钮添加' />
              ) : (
                fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 16,
                      border: '1px dashed #d9d9d9',
                      padding: 16,
                      borderRadius: 4,
                    }}
                  >
                    <Row gutter={16} align='middle'>
                      <Col span={22}>
                        <Title level={5}>商品 #{index + 1}</Title>
                      </Col>
                      <Col span={2} style={{ textAlign: 'right' }}>
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ fontSize: 18, color: '#ff4d4f' }}
                        />
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productName']}
                          label='产品名称'
                          rules={[{ required: true, message: '请选择产品' }]}
                        >
                          <Input disabled placeholder='自动获取产品名称' />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productCode']}
                          label='产品编码'
                        >
                          <Input disabled placeholder='自动获取产品编码' />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'areaName']}
                          label='所属区域'
                        >
                          <Input disabled placeholder='自动获取区域' />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'expectedQuantity']}
                          label='出库数量'
                          rules={[
                            { required: true, message: '请输入出库数量' },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            max={
                              form.getFieldValue([
                                'orderItems',
                                name,
                                'maxQuantity',
                              ]) || 9999
                            }
                            style={{ width: '100%' }}
                            placeholder='请输入出库数量'
                            onChange={() =>
                              handleQuantityOrPriceChange(index, 'outbound')
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label='单价'
                          rules={[
                            { required: true, message: '单价由系统自动获取' },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                            placeholder='系统自动获取'
                            disabled
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label='金额'
                        >
                          <InputNumber
                            disabled
                            style={{ width: '100%' }}
                            formatter={(value) =>
                              `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'batchNumber']}
                          label='批次号'
                          rules={[
                            { required: true, message: '请选择库存获取批次号' },
                          ]}
                        >
                          <Input disabled placeholder='自动获取批次号' />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productionDate']}
                          label='生产日期'
                          rules={[
                            {
                              required: true,
                              message: '请选择库存获取生产日期',
                            },
                          ]}
                        >
                          <Input disabled placeholder='自动获取生产日期' />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      {...restField}
                      name={[name, 'remark']}
                      label='备注'
                    >
                      <Input placeholder='请输入备注' />
                    </Form.Item>
                  </div>
                ))
              )}
            </>
          )}
        </Form.List>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Text strong>总数量：{totalQuantity}</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Text strong>总金额：¥ {totalAmount.toFixed(2)}</Text>
          </Col>
        </Row>
      </Form>

      {/* 库存选择抽屉 */}
      <StockSelectDrawer
        visible={stockDrawerVisible}
        onClose={() => setStockDrawerVisible(false)}
        onSelectStock={handleSelectStocks}
        placement='bottom'
      />
    </>
  );
};

export default OutboundOrderForm;
