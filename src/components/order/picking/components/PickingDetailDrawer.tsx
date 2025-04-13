import React, { useEffect, useState } from 'react';
import { Drawer, Typography, Descriptions, Tabs, Spin, message } from 'antd';
import {
  getPickingDetail,
  PickingOrderVo,
} from '../../../../api/order-service/PickingController';
import { renderPickingStatus } from '../../components/StatusComponents';
import moment from 'moment';

const { Title } = Typography;

interface PickingDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  pickingOrder: PickingOrderVo | null;
}

const PickingDetailDrawer: React.FC<PickingDetailDrawerProps> = ({
  visible,
  onClose,
  pickingOrder,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any[]>([]);

  // 获取拣货详情数据
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!visible || !pickingOrder) {
        return;
      }

      setLoading(true);
      try {
        const result = await getPickingDetail(pickingOrder.id);
        if (result.code === 200) {
          setDetailData(result.data);
        } else {
          message.error(result.msg || '获取拣货详情失败');
        }
      } catch (error) {
        console.error('获取拣货详情失败:', error);
        message.error('获取拣货详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    if (visible && pickingOrder) {
      fetchDetailData();
    }
  }, [visible, pickingOrder]);

  if (!pickingOrder) {
    return null;
  }

  const items = [
    {
      key: '1',
      label: '基本信息',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label='拣货单号'>
            {pickingOrder.pickingNo}
          </Descriptions.Item>
          <Descriptions.Item label='拣货员'>
            {pickingOrder.pickingUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='拣货状态'>
            {renderPickingStatus(pickingOrder.status)}
          </Descriptions.Item>
          <Descriptions.Item label='订单数量'>
            {pickingOrder.totalOrders}
          </Descriptions.Item>
          <Descriptions.Item label='商品种类'>
            {pickingOrder.totalItems}
          </Descriptions.Item>
          <Descriptions.Item label='总数量'>
            {pickingOrder.totalQuantity}
          </Descriptions.Item>
          <Descriptions.Item label='创建时间'>
            {pickingOrder.createTime
              ? moment(pickingOrder.createTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='更新时间'>
            {pickingOrder.updateTime
              ? moment(pickingOrder.updateTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='备注' span={2}>
            {pickingOrder.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '2',
      label: '拣货详情',
      children: (
        <Spin spinning={loading}>
          <div style={{ padding: '20px 0' }}>
            <p>拣货详情内容（待实现）</p>
            <p>已加载 {detailData.length} 条详情数据</p>
          </div>
        </Spin>
      ),
    },
    {
      key: '3',
      label: '关联订单',
      children: (
        <Spin spinning={loading}>
          <div style={{ padding: '20px 0' }}>
            <p>关联订单内容（待实现）</p>
          </div>
        </Spin>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          拣货单详情
        </Title>
      }
      placement='right'
      width='calc(100vw - 256px)'
      onClose={onClose}
      open={visible}
      closable={true}
      destroyOnClose={true}
    >
      <Tabs defaultActiveKey='1' items={items} />
    </Drawer>
  );
};

export default PickingDetailDrawer;
