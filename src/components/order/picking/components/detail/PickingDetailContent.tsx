import React, { useState } from 'react';
import {
  Spin,
  Table,
  Tag,
  Card,
  Collapse,
  Space,
  Descriptions,
  Tooltip,
  Button,
} from 'antd';
import {
  PickingDetailVo,
  PickingItemVo,
} from '../../../../../api/order-service/PickingController';
import {
  renderOrderStatus,
  renderPickingStatus,
} from '../../../components/StatusComponents';
import moment from 'moment';
import PickingOperationDrawer from '../operation/PickingOperationDrawer';
import { ReloadOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

// 拣货详情内容组件
interface PickingDetailContentProps {
  loading: boolean;
  detailData: PickingDetailVo[];
  onOperationComplete?: () => void;
  onRefresh?: () => void;
}

const PickingDetailContent: React.FC<PickingDetailContentProps> = ({
  loading,
  detailData,
  onOperationComplete,
  onRefresh,
}) => {
  // 新增抽屉相关状态
  const [operationDrawerVisible, setOperationDrawerVisible] =
    useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<{
    orderNo: string;
    orderId: string;
    pickingItems: PickingItemVo[];
    isAllNotPicked: boolean;
  } | null>(null);

  // 手动刷新数据
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // 拣货项表格列定义
  const pickingItemColumns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (productName: string) => (
        <Tooltip placement='topLeft' title={productName}>
          <span>{productName}</span>
        </Tooltip>
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
      title: '预期数量',
      dataIndex: 'expectedQuantity',
      key: 'expectedQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 120,
      render: (areaName: string) => <Tag color='blue'>{areaName || '-'}</Tag>,
    },
    {
      title: '货位',
      dataIndex: 'locations',
      key: 'locations',
      width: 180,
      render: (locationName: any[]) => (
        <Space size={[0, 4]} wrap>
          {locationName?.map(
            (loc, idx) => (
              console.log(loc),
              (
                <Tag key={idx} color='cyan' style={{ marginBottom: 4 }}>
                  {`${loc.shelfName}: ${loc.storageNames.join(', ')}`}
                </Tag>
              )
            )
          )}
          {(!locationName || locationName.length === 0) && '-'}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => renderPickingStatus(status),
    },
    {
      title: '拣货时间',
      dataIndex: 'pickingTime',
      key: 'pickingTime',
      width: 180,
      render: (text: string) =>
        text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size='large' tip='加载中...' />
      </div>
    );
  }

  if (!detailData || detailData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        暂无拣货详情数据
      </div>
    );
  }

  // 打开拣货操作抽屉
  const openPickingOperationDrawer = (detail: PickingDetailVo) => {
    if (!detail.pickingItems || detail.pickingItems.length === 0) {
      return;
    }

    // 检查是否所有项目都是未拣货状态(status === 0)
    const allItemsNotPicked = detail.pickingItems.every(
      (item) => item.status === 0
    );

    setCurrentOrder({
      orderNo: detail.order?.orderNo || '',
      orderId: detail.order?.id || '',
      pickingItems: detail.pickingItems,
      isAllNotPicked: allItemsNotPicked,
    });

    setOperationDrawerVisible(true);
  };

  // 关闭拣货操作抽屉
  const closePickingOperationDrawer = () => {
    setOperationDrawerVisible(false);
    setCurrentOrder(null);
    
    // 拣货操作完成后通知父组件
    if (onOperationComplete) {
      onOperationComplete();
    }
  };

  // 检查拣货状态，决定显示"开始拣货"还是"继续拣货"
  const getPickingActionButton = (detail: PickingDetailVo) => {
    const pickingItems = detail.pickingItems;
    if (!pickingItems || pickingItems.length === 0) {
      return null;
    }

    // 检查是否存在未拣货(status === 0)或拣货中(status === 1)的项目
    const hasUncompletedItems = pickingItems.some(
      (item) => item.status === 0 || item.status === 1
    );

    // 如果不存在未完成的拣货项，不显示按钮
    if (!hasUncompletedItems) {
      return null;
    }

    // 检查是否所有项目都是未拣货状态(status === 0)
    const allItemsNotPicked = pickingItems.every((item) => item.status === 0);

    return (
      <Button
        type='primary'
        size='small'
        style={{ marginRight: '10px' }}
        onClick={() => openPickingOperationDrawer(detail)}
      >
        {allItemsNotPicked ? '开始拣货' : '继续拣货'}
      </Button>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>
      
      {detailData.map((detail, index) => (
        <Card
          key={index}
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Tooltip title={`订单信息: ${detail.order?.orderNo || ''}`}>
                <span
                  className='card-title-text'
                  style={{
                    maxWidth: 300,
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  订单信息:{' '}
                  <a href={`/order/in-out?orderNo=${detail.order?.orderNo}`}>
                    {detail.order?.orderNo || ''}
                  </a>
                </span>
              </Tooltip>
              <div>
                {getPickingActionButton(detail)}
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                  title="刷新数据"
                />
              </div>
            </div>
          }
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color='blue'>
                订单状态:{' '}
                {detail.order?.status !== undefined
                  ? renderOrderStatus(detail.order.status || 0, 0)
                  : '未知'}
              </Tag>
              <Tag color='cyan'>商品种类: {detail.orderInfo?.length || 0}</Tag>
            </Space>
          }
        >
          <Collapse defaultActiveKey={['1']} ghost>
            <Panel header='订单基本信息' key='1'>
              <Descriptions bordered size='small' column={2}>
                <Descriptions.Item label='订单类型'>
                  {detail.order?.orderType === 1
                    ? '销售出库'
                    : detail.order?.orderType === 2
                    ? '调拨出库'
                    : '其他出库'}
                </Descriptions.Item>
                <Descriptions.Item label='总金额'>
                  ¥{detail.order?.totalAmount?.toFixed(2) || '0.00'}
                </Descriptions.Item>
                <Descriptions.Item label='总数量'>
                  {detail.order?.totalQuantity || 0}
                </Descriptions.Item>
                <Descriptions.Item label='联系人'>
                  {detail.order?.contactName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label='联系电话'>
                  {detail.order?.contactPhone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label='配送地址' span={2}>
                  {detail.order?.deliveryAddress || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Panel>

            <Panel header='拣货明细' key='3'>
              <Table
                dataSource={detail.pickingItems || []}
                columns={pickingItemColumns}
                rowKey='id'
                pagination={false}
                size='small'
                scroll={{ x: 'max-content', y: 250 }}
              />
            </Panel>
          </Collapse>
        </Card>
      ))}

      {/* 拣货操作抽屉 */}
      {currentOrder && (
        <PickingOperationDrawer
          visible={operationDrawerVisible}
          onClose={closePickingOperationDrawer}
          orderNo={currentOrder.orderNo}
          orderId={currentOrder.orderId}
          pickingItems={currentOrder.pickingItems}
          isAllNotPicked={currentOrder.isAllNotPicked}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default PickingDetailContent;
