import React, { useEffect, useState } from 'react';
import { Drawer, Typography, Descriptions, Tabs, message } from 'antd';
import {
  getPickingDetail,
  PickingDetailVo,
  PickingOrderVo,
} from '../../../../api/order-service/PickingController';
import { renderPickingStatus } from '../../components/StatusComponents';
import moment from 'moment';
import PickingDetailContent from './detail/PickingDetailContent';

const { Title } = Typography;

interface PickingDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  pickingOrder: PickingOrderVo | null;
  activeTab?: string; // 初始显示的标签页
  onRefresh?: () => void; // 添加刷新回调函数
}

const PickingDetailDrawer: React.FC<PickingDetailDrawerProps> = ({
  visible,
  onClose,
  pickingOrder,
  activeTab = '1', // 默认显示基本信息标签页
  onRefresh, // 添加参数
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<PickingDetailVo[]>([]);
  const [dataChanged, setDataChanged] = useState<boolean>(false); // 添加数据变更标记

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

  // 关闭抽屉时如果数据有变更则触发刷新
  const handleClose = () => {
    onClose();
    // 如果有数据变更或者onRefresh回调存在，则调用刷新函数
    if ((dataChanged || activeTab === '2') && onRefresh) {
      onRefresh();
    }
  };

  // 操作完成后触发数据更新标记
  const handleOperationComplete = () => {
    setDataChanged(true);
  };

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
      label: '详情信息',
      children: <PickingDetailContent loading={loading} detailData={detailData} onOperationComplete={handleOperationComplete} />,
    },
  ];

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          拣货单详情
        </Title>
      }
      push={false}
      placement='right'
      width='calc(100vw - 256px)'
      onClose={handleClose}
      open={visible}
      closable={true}
      destroyOnClose={true}
    >
      <Tabs defaultActiveKey={activeTab} items={items} />
    </Drawer>
  );
};

export default PickingDetailDrawer;
