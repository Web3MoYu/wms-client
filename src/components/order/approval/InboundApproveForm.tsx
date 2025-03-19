import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Select, 
  Row, 
  Col, 
  message, 
  Tag,
  Space,
  Button
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { OrderVo } from '../../../api/order-service/OrderController';
import { Area, getAllAreas } from '../../../api/location-service/AreaController';
import { Shelf, getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import { getStoragesByShelfId } from '../../../api/location-service/StorageController';
import { inDetail, OrderInItem } from '../../../api/order-service/OrderController';
import { ApprovalDto } from '../../../api/order-service/ApprovalController';

const { Text } = Typography;
const { Option } = Select;

interface InboundApproveFormProps {
  form: any;
  order: OrderVo;
}

// 入库订单同意组件
const InboundApproveForm: React.FC<InboundApproveFormProps> = ({ form, order }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [shelves, setShelves] = useState<{ [areaId: string]: Shelf[] }>({});
  const [storages, setStorages] = useState<{ [shelfId: string]: any[] }>({});
  const [orderDetails, setOrderDetails] = useState<OrderInItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 组件加载时获取订单详情和区域列表
  useEffect(() => {
    fetchOrderDetails();
    fetchAreas();
  }, [order.id]);

  // 获取订单详情
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      if (order?.id) {
        const res = await inDetail(order.id);
        if (res.code === 200) {
          // 提取订单明细项
          const details: OrderInItem[] = res.data.map(item => item.orderItems);
          setOrderDetails(details);
          
          // 初始化表单数据
          initFormData(details);
        }
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化表单数据
  const initFormData = (details: OrderInItem[]) => {
    const approvalItems: ApprovalDto[] = details.map(item => ({
      id: item.id,
      areaId: item.areaId || '',
      location: [
        {
          shelfId: '',
          storageIds: []
        }
      ]
    }));
    
    form.setFieldsValue({ approvalItems });
  };

  // 获取所有区域
  const fetchAreas = async () => {
    try {
      const res = await getAllAreas();
      if (res.code === 200) {
        setAreas(res.data);
      }
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  };

  // 加载货架列表
  const loadShelves = async (areaId: string) => {
    if (!areaId || shelves[areaId]) return;
    
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves(prev => ({
          ...prev,
          [areaId]: res.data
        }));
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
    }
  };

  // 加载库位列表
  const loadStorages = async (shelfId: string) => {
    if (!shelfId || storages[shelfId]) return;
    
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setStorages(prev => ({
          ...prev,
          [shelfId]: res.data
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  // 处理区域变更
  const handleAreaChange = (areaId: string, index: number) => {
    // 清空当前项的货架和库位选择
    const approvalItems = form.getFieldValue('approvalItems');
    if (approvalItems && approvalItems[index]) {
      approvalItems[index].location = [
        {
          shelfId: '',
          storageIds: []
        }
      ];
      form.setFieldsValue({ approvalItems });
    }
    
    // 加载该区域的货架列表
    loadShelves(areaId);
  };

  // 处理货架变更
  const handleShelfChange = (shelfId: string, indexItem: number, indexLocation: number) => {
    // 清空当前项的库位选择
    const approvalItems = form.getFieldValue('approvalItems');
    if (approvalItems && approvalItems[indexItem] && approvalItems[indexItem].location[indexLocation]) {
      approvalItems[indexItem].location[indexLocation].storageIds = [];
      form.setFieldsValue({ approvalItems });
    }
    
    // 加载该货架的库位列表
    loadStorages(shelfId);
  };

  return (
    <Card title="入库订单审批表单" bordered={false} style={{ marginTop: 16 }}>
      <Form.List name="approvalItems">
        {(fields) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => {
              const detail = orderDetails[index];
              const areaId = form.getFieldValue(['approvalItems', index, 'areaId']);
              
              return (
                <Card 
                  key={key} 
                  type="inner" 
                  title={`${index + 1}. ${detail?.productName || '商品'}`}
                  style={{ marginBottom: 16 }}
                  extra={<Text type="secondary">预期数量: {detail?.expectedQuantity || 0}</Text>}
                >
                  <Row gutter={16}>
                    <Col span={24}>
                      <Space>
                        <Text strong>商品ID:</Text>
                        <Text>{detail?.productId || '-'}</Text>
                      </Space>
                    </Col>
                  </Row>
                  
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                      <Form.Item
                        {...restField}
                        name={[name, 'areaId']}
                        label="区域"
                        rules={[{ required: true, message: '请选择区域' }]}
                      >
                        <Select
                          placeholder="请选择区域"
                          onChange={(value) => handleAreaChange(value, index)}
                          loading={loading}
                          style={{ width: '100%' }}
                        >
                          {areas.map((area) => (
                            <Option key={area.id} value={area.id}>
                              {area.areaName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.List name={[name, 'location']}>
                    {(locationFields, { add, remove }) => (
                      <>
                        {locationFields.map(({ key: locationKey, name: locationName, ...restLocationField }, locationIndex) => {
                          const shelfId = form.getFieldValue(['approvalItems', index, 'location', locationIndex, 'shelfId']);
                          
                          return (
                            <div 
                              key={locationKey} 
                              style={{ 
                                marginBottom: 16, 
                                padding: 16, 
                                border: '1px dashed #d9d9d9',
                                borderRadius: 4,
                                position: 'relative'
                              }}
                            >
                              <Row gutter={16}>
                                <Col span={locationFields.length > 1 ? 10 : 12}>
                                  <Form.Item
                                    {...restLocationField}
                                    name={[locationName, 'shelfId']}
                                    label="货架"
                                    rules={[{ required: true, message: '请选择货架' }]}
                                  >
                                    <Select
                                      placeholder="请选择货架"
                                      onChange={(value) => handleShelfChange(value, index, locationIndex)}
                                      disabled={!areaId}
                                      style={{ width: '100%' }}
                                    >
                                      {(shelves[areaId] || []).map((shelf) => (
                                        <Option key={shelf.id} value={shelf.id}>
                                          {shelf.shelfName}
                                        </Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={locationFields.length > 1 ? 12 : 12}>
                                  <Form.Item
                                    {...restLocationField}
                                    name={[locationName, 'storageIds']}
                                    label="库位"
                                    rules={[{ required: true, message: '请选择至少一个库位' }]}
                                  >
                                    <Select
                                      mode="multiple"
                                      placeholder="请选择库位"
                                      disabled={!shelfId}
                                      style={{ width: '100%' }}
                                      tagRender={(props) => {
                                        const storage = storages[shelfId]?.find(s => s.id === props.value);
                                        const displayName = storage ? storage.locationName : props.value;
                                        
                                        return (
                                          <Tag
                                            closable={props.closable}
                                            onClose={props.onClose}
                                            style={{ marginRight: 3 }}
                                          >
                                            {displayName}
                                          </Tag>
                                        );
                                      }}
                                    >
                                      {(storages[shelfId] || []).map((storage) => {
                                        const displayName = storage.locationName || storage.id;
                                        // 只显示空闲状态的库位
                                        if (storage.status === 1) {
                                          return (
                                            <Option
                                              key={storage.id}
                                              value={storage.id}
                                              label={displayName}
                                            >
                                              {displayName}
                                            </Option>
                                          );
                                        }
                                        return null;
                                      })}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                {locationFields.length > 1 && (
                                  <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Button 
                                      type="text" 
                                      danger 
                                      icon={<MinusCircleOutlined />}
                                      onClick={() => remove(locationIndex)}
                                      style={{ marginTop: 8 }}
                                    />
                                  </Col>
                                )}
                              </Row>
                            </div>
                          );
                        })}
                        
                        <Form.Item style={{ marginBottom: 0 }}>
                          <Button 
                            type="dashed" 
                            onClick={() => add()} 
                            block 
                            icon={<PlusOutlined />}
                          >
                            添加更多位置
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>
              );
            })}

            {orderDetails.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Text type="secondary">订单中没有商品明细</Text>
              </div>
            )}
          </>
        )}
      </Form.List>
    </Card>
  );
};

export default InboundApproveForm; 