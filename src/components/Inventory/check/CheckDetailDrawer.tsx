import { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Card,
  Spin,
  message,
  Tabs,
  Badge,
  Table,
  Typography,
} from 'antd';
import moment from 'moment';
import { CheckVo, CheckItemVo, detailCheck } from '../../../api/stock-service/CheckController';
import { renderCheckStatus, renderCheckItemStatus, renderDifferenceStatus } from '../components/CheckStatusComponents';
import { renderAlertStatus } from '../components/StockStatusComponents';

const { Text } = Typography;

interface CheckDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  check: CheckVo | null;
}

export default function CheckDetailDrawer({
  visible,
  onClose,
  check,
}: CheckDetailDrawerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<CheckItemVo[]>([]);

  // 获取盘点详情
  const fetchCheckDetail = async () => {
    if (!check?.id) return;

    try {
      setLoading(true);
      const result = await detailCheck(check.id);
      if (result.code === 200) {
        setDetailData(result.data);
      } else {
        message.error(result.msg || '获取盘点详情失败');
      }
    } catch (error) {
      console.error('获取盘点详情失败:', error);
      message.error('获取盘点详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 监听visible变化，当抽屉打开时获取详情
  useEffect(() => {
    if (visible && check) {
      fetchCheckDetail();
    }
  }, [visible, check]);

  // 渲染基本信息选项卡内容
  const renderBasicInfo = () => {
    if (!check) return null;

    return (
      <Card title='基本信息' size='small'>
        <Descriptions column={3} bordered>
          <Descriptions.Item label='盘点单号' span={1}>
            {check.checkNo}
          </Descriptions.Item>
          <Descriptions.Item label='盘点状态' span={1}>
            {renderCheckStatus(check.status)}
          </Descriptions.Item>
          <Descriptions.Item label='区域' span={1}>
            {check.area?.areaName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='计划开始时间' span={1}>
            {check.planStartTime ? moment(check.planStartTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='计划结束时间' span={1}>
            {check.planEndTime ? moment(check.planEndTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='实际开始时间' span={1}>
            {check.actualStartTime ? moment(check.actualStartTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='实际结束时间' span={1}>
            {check.actualEndTime ? moment(check.actualEndTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='创建人' span={1}>
            {check.creatorUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='盘点人' span={1}>
            {check.checkerUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='创建时间' span={2}>
            {check.createTime ? moment(check.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='备注' span={3}>
            {check.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 渲染盘点详情选项卡内容
  const renderCheckDetails = () => {
    const columns = [
      {
        title: '产品名称',
        dataIndex: ['stock', 'productName'],
        key: 'productName',
        width: 150,
        ellipsis: true,
      },
      {
        title: '批次号',
        dataIndex: ['stock', 'batchNumber'],
        key: 'batchNumber',
        width: 120,
      },
      {
        title: '位置',
        dataIndex: ['stock', 'locationVo'],
        key: 'location',
        width: 150,
        ellipsis: false,
        render: (locationVo: any[]) => {
          if (!locationVo || locationVo.length === 0) return '-';
          return (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {locationVo.map((item, index) => {
                const storageName = item.storageNames && item.storageNames.length > 0 
                  ? item.storageNames.join('、') 
                  : '';
                return (
                  <div key={index}>
                    {`${item.shelfName}${storageName ? `(${storageName})` : ''}`}
                  </div>
                );
              })}
            </div>
          );
        }
      },
      {
        title: '系统数量',
        dataIndex: 'systemQuantity',
        key: 'systemQuantity',
        width: 100,
      },
      {
        title: '实际数量',
        dataIndex: 'actualQuantity',
        key: 'actualQuantity',
        width: 100,
        render: (text: number, record: CheckItemVo) => (
          record.status === 1 ? text : '-'
        ),
      },
      {
        title: '差异数量',
        dataIndex: 'differenceQuantity',
        key: 'differenceQuantity',
        width: 100,
        render: (text: number, record: CheckItemVo) => (
          record.status === 1 ? (
            <Text type={text !== 0 ? 'danger' : 'success'}>
              {text}
            </Text>
          ) : '-'
        ),
      },
      {
        title: '预警状态',
        dataIndex: ['stock', 'alertStatus'],
        key: 'alertStatus',
        width: 100,
        render: (alertStatus: number) => renderAlertStatus(alertStatus),
      },
      {
        title: '盘点状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: renderCheckItemStatus,
      },
      {
        title: '是否差异',
        dataIndex: 'isDifference',
        key: 'isDifference',
        width: 100,
        render: (text: number, record: CheckItemVo) => (
          record.status === 0 ? '-' : renderDifferenceStatus(text)
        ),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 100,
        ellipsis: true,
        render: (text: string) => text || '-',
      },
    ];

    return (
      <Card title='盘点明细' size='small'>
        <Table
          dataSource={detailData}
          columns={columns}
          rowKey='id'
          size='small'
          pagination={false}
          scroll={{ x: 'max-content', y: 500 }}
        />
      </Card>
    );
  };

  // 定义选项卡项
  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: renderBasicInfo(),
    },
    {
      key: 'details',
      label: (
        <Badge count={detailData.length} offset={[10, 0]}>
          盘点明细
        </Badge>
      ),
      children: renderCheckDetails(),
    },
  ];

  return (
    <Drawer
      title='盘点详情'
      placement='right'
      width={1200}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey='basic'
          items={tabItems}
          style={{ marginBottom: 32 }}
          size='large'
          type='card'
        />
      </Spin>
    </Drawer>
  );
} 