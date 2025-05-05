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
  Input,
  Button,
  Modal,
} from 'antd';
import moment from 'moment';
import {
  CheckVo,
  CheckItemVo,
  detailCheck,
  startCheck,
  StockCheckDto,
} from '../../../api/stock-service/CheckController';
import {
  renderCheckStatus,
  renderCheckItemStatus,
  renderDifferenceStatus,
} from '../components/CheckStatusComponents';
import { renderAlertStatus } from '../components/StockStatusComponents';

const { Text } = Typography;

// 抽屉打开模式
type DrawerMode = 'view' | 'edit';

interface CheckDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  check: CheckVo | null;
  mode?: DrawerMode; // 模式：view-查看，edit-编辑
  defaultActiveKey?: string; // 默认激活的标签页
  onSuccess?: () => void; // 成功回调函数
}

export default function CheckDetailDrawer({
  visible,
  onClose,
  check,
  mode = 'view',
  defaultActiveKey = 'basic',
  onSuccess,
}: CheckDetailDrawerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<CheckItemVo[]>([]);
  const [editableData, setEditableData] = useState<CheckItemVo[]>([]);
  const [activeKey, setActiveKey] = useState<string>(defaultActiveKey);
  const isEditMode = mode === 'edit';

  // 获取盘点详情
  const fetchCheckDetail = async () => {
    if (!check?.id) return;

    try {
      setLoading(true);
      const result = await detailCheck(check.id);
      if (result.code === 200) {
        setDetailData(result.data);
        // 初始化可编辑数据，默认实际数量等于系统数量
        const editData = result.data.map((item) => ({
          ...item,
          actualQuantity: item.systemQuantity,
        }));
        setEditableData(editData);
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
      // 设置默认标签页
      setActiveKey(defaultActiveKey);
    }
  }, [visible, check, defaultActiveKey]);

  // 处理输入框变化
  const handleQuantityChange = (value: number, record: CheckItemVo) => {
    const newData = editableData.map((item) => {
      if (item.id === record.id) {
        const actualQuantity = value || 0;
        const differenceQuantity = actualQuantity - item.systemQuantity;
        return {
          ...item,
          actualQuantity,
          differenceQuantity,
          status: 2, // 已盘点
          isDifference: differenceQuantity !== 0 ? 1 : 0, // 有差异为1，无差异为0
        };
      }
      return item;
    });
    setEditableData(newData);
  };

  // 提交盘点数据
  const handleSubmitCheck = async () => {
    // 准备提交数据，将所有未盘点的项设置为已盘点且数量等于系统数量
    const finalData = editableData.map((item) => {
      if (item.status === 0) {
        // 如果项目未盘点，则设置为已盘点且实际数量等于系统数量
        return {
          ...item,
          actualQuantity: item.systemQuantity,
          differenceQuantity: 0,
          status: 2, // 已盘点
          isDifference: 0, // 无差异
        };
      }
      return item;
    });

    // 更新可编辑数据
    setEditableData(finalData);

    // 二次确认
    Modal.confirm({
      title: '确认提交',
      content: '确定要提交盘点结果吗？提交后无法修改。',
      onOk: async () => {
        try {
          setSubmitting(true);
          // 准备提交的数据
          const submitData: StockCheckDto[] = finalData.map((item) => ({
            checkItemId: item.id,
            actualQuantity: item.actualQuantity,
          }));
          
          const result = await startCheck(submitData);
          if (result.code === 200) {
            message.success('盘点提交成功');
            // 调用成功回调，刷新表格数据
            if (onSuccess) {
              onSuccess();
            }
            onClose(); // 关闭抽屉
          } else {
            message.error(result.msg || '盘点提交失败');
          }
        } catch (error) {
          console.error('盘点提交失败:', error);
          message.error('盘点提交失败，请稍后重试');
        } finally {
          setSubmitting(false);
        }
      },
      onCancel: () => {
        setSubmitting(false);
      },
    });
  };

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
            {check.planStartTime
              ? moment(check.planStartTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='计划结束时间' span={1}>
            {check.planEndTime
              ? moment(check.planEndTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='实际开始时间' span={1}>
            {check.actualStartTime
              ? moment(check.actualStartTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='实际结束时间' span={1}>
            {check.actualEndTime
              ? moment(check.actualEndTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='创建人' span={1}>
            {check.creatorUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='盘点人' span={1}>
            {check.checkerUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='创建时间' span={2}>
            {check.createTime
              ? moment(check.createTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
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
    // 根据盘点单状态和编辑模式决定是否可编辑
    const isEditable = check?.status === 0 && isEditMode; // 只有在待盘点状态且是编辑模式下才能编辑
    const dataSource = isEditable ? editableData : detailData;

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
                const storageName =
                  item.storageNames && item.storageNames.length > 0
                    ? item.storageNames.join('、')
                    : '';
                return (
                  <div key={index}>
                    {`${item.shelfName}${
                      storageName ? `(${storageName})` : ''
                    }`}
                  </div>
                );
              })}
            </div>
          );
        },
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
        render: (text: number, record: CheckItemVo) =>
          isEditable ? (
            <Input
              type='number'
              defaultValue={record.systemQuantity}
              onChange={(e) =>
                handleQuantityChange(parseInt(e.target.value) || 0, record)
              }
              min={0}
              style={{ width: '100%' }}
            />
          ) : record.status === 2 ? (
            text
          ) : (
            '-'
          ),
      },
      {
        title: '差异数量',
        dataIndex: 'differenceQuantity',
        key: 'differenceQuantity',
        width: 100,
        render: (text: number, record: CheckItemVo) =>
          record.status === 2 ? (
            <Text type={text !== 0 ? 'danger' : 'success'}>{text}</Text>
          ) : (
            '-'
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
        render: (text: number, record: CheckItemVo) =>
          record.status === 0 ? '-' : renderDifferenceStatus(text),
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
      <Card
        title='盘点明细'
        size='small'
        extra={
          isEditable && (
            <Button
              type='primary'
              onClick={handleSubmitCheck}
              loading={submitting}
              disabled={!editableData.length}
            >
              提交盘点
            </Button>
          )
        }
      >
        <Table
          dataSource={dataSource}
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
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
          style={{ marginBottom: 32 }}
          size='large'
          type='card'
        />
      </Spin>
    </Drawer>
  );
}
