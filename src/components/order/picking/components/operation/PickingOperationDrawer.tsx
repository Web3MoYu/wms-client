import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Typography,
  Space,
  Tag,
  InputNumber,
  Form,
  Button,
  message,
  Cascader,
  Spin,
} from 'antd';
import {
  PickingItemVo,
  getPickingLocation,
  PickingLocation,
} from '../../../../../api/order-service/PickingController';
import { renderPickingStatus } from '../../../components/StatusComponents';

const { Title } = Typography;

interface PickingOperationDrawerProps {
  visible: boolean;
  onClose: () => void;
  orderNo: string;
  orderId: string; // 订单ID
  pickingItems: PickingItemVo[];
  isAllNotPicked: boolean; // 是否所有商品都未拣货
}

// 级联选择器选项格式
interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

const PickingOperationDrawer: React.FC<PickingOperationDrawerProps> = ({
  visible,
  onClose,
  orderNo,
  orderId,
  pickingItems,
  isAllNotPicked,
}) => {
  const [form] = Form.useForm();
  const [editingItems, setEditingItems] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<
    Record<string, PickingLocation>
  >({});
  const [locationOptions, setLocationOptions] = useState<
    Record<string, CascaderOption[]>
  >({});

  // 获取拣货位置信息
  useEffect(() => {
    if (visible && pickingItems.length > 0) {
      fetchLocationData();
    }
  }, [visible, pickingItems]);

  // 获取位置信息
  const fetchLocationData = async () => {
    if (!orderId) return;

    setLocationLoading(true);
    try {
      const result = await getPickingLocation(orderId);
      if (result.code === 200 && result.data) {
        // 将位置数据按itemId进行索引
        const locationMap: Record<string, PickingLocation> = {};
        const optionsMap: Record<string, CascaderOption[]> = {};

        result.data.forEach((location) => {
          locationMap[location.itemId] = location;

          // 转换为级联选择器需要的格式
          if (location.locations && location.locations.length > 0) {
            const options: CascaderOption[] = [];

            // 按货架分组
            const shelfMap = new Map<string, any[]>();
            location.locations.forEach((loc) => {
              if (!shelfMap.has(loc.shelf.shelfName)) {
                shelfMap.set(loc.shelf.shelfName, []);
              }
              shelfMap.get(loc.shelf.shelfName)?.push(loc);
            });

            // 生成级联选择器选项
            shelfMap.forEach((locs, shelfName) => {
              const option: CascaderOption = {
                value: shelfName,
                label: shelfName,
                children: locs.flatMap((loc) =>
                  loc.storages.map((storage: any) => ({
                    value: storage.id || '',
                    label: storage.locationName || '',
                  }))
                ),
              };
              options.push(option);
            });

            optionsMap[location.itemId] = options;
          }
        });

        setLocationData(locationMap);
        setLocationOptions(optionsMap);
      } else {
        message.error(result.msg || '获取拣货位置信息失败');
      }
    } catch (error) {
      console.error('获取拣货位置信息失败:', error);
      message.error('获取拣货位置信息失败，请重试');
    } finally {
      setLocationLoading(false);
    }
  };

  // 处理拣货数量变更
  const handleQuantityChange = (
    value: number | null,
    record: PickingItemVo
  ) => {
    setEditingItems({
      ...editingItems,
      [record.id]: {
        ...editingItems[record.id],
        actualQuantity: value,
      },
    });
  };

  // 处理货位选择变更
  const handleLocationChange = (value: any[], record: PickingItemVo) => {
    // 提取所选货架和库位信息
    const selectedLocations = value.map((item) => {
      const shelf = item[0];
      const storage = item[1];
      return { shelf, storage };
    });

    setEditingItems({
      ...editingItems,
      [record.id]: {
        ...editingItems[record.id],
        selectedLocations,
      },
    });
  };

  // 提交拣货数据
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 这里实际项目中需要调用API保存拣货数据
      // 构建提交数据
      const submitData = Object.keys(editingItems).map((itemId) => ({
        id: itemId,
        actualQuantity:
          editingItems[itemId].actualQuantity ||
          pickingItems.find((item) => item.id === itemId)?.expectedQuantity ||
          0,
        selectedLocations: editingItems[itemId].selectedLocations || [],
      }));

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('提交的拣货数据:', submitData);

      message.success('拣货数据已保存');
      onClose();
    } catch (error) {
      console.error('保存拣货数据失败:', error);
      message.error('保存拣货数据失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Typography.Text
          ellipsis={{ tooltip: text }}
          style={{ width: 200, display: 'block' }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '商品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: '区域',
      dataIndex: 'id',
      key: 'area',
      width: 120,
      render: (itemId: string) => {
        const location = locationData[itemId];
        return location ? (
          <Tag color='blue'>{location.area?.areaName || '-'}</Tag>
        ) : locationLoading ? (
          <Spin size='small' />
        ) : (
          <Tag color='default'>-</Tag>
        );
      },
    },
    {
      title: '货位选择',
      dataIndex: 'id',
      key: 'location',
      width: 220,
      render: (itemId: string, record: PickingItemVo) => {
        const options = locationOptions[itemId];
        return locationLoading ? (
          <Spin size='small' />
        ) : options && options.length > 0 ? (
          <Cascader
            options={options}
            multiple
            maxTagCount='responsive'
            placeholder='请选择货架和库位'
            displayRender={(labels) => labels.join(' / ')}
            onChange={(value) => handleLocationChange(value, record)}
            style={{ width: '100%' }}
          />
        ) : (
          <span>无可用货位</span>
        );
      },
    },
    {
      title: '预期数量',
      dataIndex: 'expectedQuantity',
      key: 'expectedQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 120,
      render: (_text: number, record: PickingItemVo) => (
        <InputNumber
          min={0}
          max={record.expectedQuantity * 2}
          defaultValue={record.expectedQuantity}
          onChange={(value) => handleQuantityChange(value, record)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => renderPickingStatus(status),
    },
  ];

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          {isAllNotPicked ? '开始拣货' : '继续拣货'} - 订单 {orderNo}
        </Title>
      }
      placement='right'
      width='80%'
      onClose={onClose}
      open={visible}
      closable={true}
      destroyOnClose={true}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type='primary'
            onClick={handleSubmit}
            loading={submitting || locationLoading}
            disabled={locationLoading}
          >
            {locationLoading ? '加载位置信息中...' : '提交'}
          </Button>
        </Space>
      }
    >
      {locationLoading ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Spin tip='正在加载拣货位置信息...' />
        </div>
      ) : (
        <Form form={form} layout='vertical'>
          <Table
            dataSource={pickingItems}
            columns={columns}
            rowKey='id'
            pagination={false}
            scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
          />
        </Form>
      )}
    </Drawer>
  );
};

export default PickingOperationDrawer;
