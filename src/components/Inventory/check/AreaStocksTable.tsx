import { useState, useEffect } from 'react';
import { Table, Button, message, Tooltip, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  getStockList,
  StockDto,
  StockVo,
} from '../../../api/stock-service/StockController';
import { renderAlertStatus } from '../components/StockStatusComponents';
import StockDetail from '../stock/StockDetail';
import moment from 'moment';

interface AreaStocksTableProps {
  areaId: string;
  onStocksLoaded?: (hasStocks: boolean) => void;
}

export default function AreaStocksTable({ 
  areaId, 
  onStocksLoaded 
}: AreaStocksTableProps) {
  const [stocks, setStocks] = useState<StockVo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<any>({
    current: 1,
    pageSize: 10,
  });
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [currentStock, setCurrentStock] = useState<StockVo | null>(null);

  useEffect(() => {
    if (areaId) {
      fetchStocks();
    }
  }, [areaId, pagination.current, pagination.pageSize]);

  // 获取库存数据
  const fetchStocks = async () => {
    if (!areaId) return;

    setLoading(true);
    try {
      const params: StockDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        productId: '',
        areaId: areaId,
        status: null,
        batchNumber: '',
        ascSortByProdDate: null,
        ascSortByQuantity: null,
        ascSortByAvailableQuantity: null,
      };

      const res = await getStockList(params);
      if (res.code === 200) {
        const stockRecords = res.data.records || [];
        setStocks(stockRecords);
        setTotal(res.data.total || 0);
        
        // 通知父组件是否有库存
        if (onStocksLoaded) {
          onStocksLoaded(stockRecords.length > 0);
        }
      } else {
        message.error(res.msg || '获取库存数据失败');
        // 通知父组件没有库存（出错时默认为没有）
        if (onStocksLoaded) {
          onStocksLoaded(false);
        }
      }
    } catch (error) {
      console.error('获取库存数据出错:', error);
      message.error('获取库存数据出错');
      // 通知父组件没有库存（出错时默认为没有）
      if (onStocksLoaded) {
        onStocksLoaded(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理表格变更（分页、排序等）
  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  // 查看库存详情
  const showStockDetail = (stock: StockVo) => {
    setCurrentStock(stock);
    setDetailVisible(true);
  };

  // 关闭库存详情抽屉
  const closeStockDetail = () => {
    setDetailVisible(false);
  };

  // 表格列定义
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '可用数量',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
    },
    {
      title: '警告状态',
      dataIndex: 'alertStatus',
      key: 'alertStatus',
      width: 120,
      render: (alertStatus: number) => renderAlertStatus(alertStatus),
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 150,
      render: (date: string) =>
        date ? moment(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: StockVo) => (
        <Button
          type='link'
          icon={<SearchOutlined />}
          onClick={() => showStockDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={stocks}
        rowKey='id'
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        size='middle'
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: <Empty description="该区域暂无库存数据" />
        }}
      />

      {currentStock && (
        <StockDetail
          visible={detailVisible}
          onClose={closeStockDetail}
          stock={currentStock}
          onRefresh={fetchStocks}
        />
      )}
    </div>
  );
}
