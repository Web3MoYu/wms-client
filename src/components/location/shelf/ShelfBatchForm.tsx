import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Table, Button, Input, Select, Typography, Space, message } from 'antd';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Area } from '../../../api/location-service/AreaController';
import { Shelf, checkShelfCode, checkShelfName } from '../../../api/location-service/ShelfController';

const { Option } = Select;

// 批量添加的货架项接口
interface BatchShelfItem extends Omit<Shelf, 'id' | 'createTime' | 'updateTime'> {
  key: string;
  codeValid?: boolean;
  nameValid?: boolean;
  codeError?: string;
  nameError?: string;
  validateStatus?: 'success' | 'error' | 'validating' | '';
}

// 批量添加提交数据接口
type BatchShelfData = Pick<Shelf, 'areaId' | 'shelfName' | 'shelfCode' | 'status'>;

// 导出BatchFormRef类型，提供给父组件
export interface BatchFormRef {
  resetBatchForm: () => void;
}

interface ShelfBatchFormProps {
  areaList: Area[];
  onSubmit: (shelves: BatchShelfData[]) => Promise<void>;
  loading: boolean;
}

const ShelfBatchForm = forwardRef<BatchFormRef, ShelfBatchFormProps>(({
  areaList,
  onSubmit,
  loading,
}, ref) => {
  const [batchShelfList, setBatchShelfList] = useState<BatchShelfItem[]>([]);
  const [validating, setValidating] = useState<boolean>(false);

  // 对外暴露的方法
  useImperativeHandle(ref, () => ({
    resetBatchForm: () => {
      initBatchList();
    },
  }));

  // 初始化一行数据（不再在首次渲染时自动调用）
  useEffect(() => {
    // 组件挂载时也需要初始化
    if (batchShelfList.length === 0) {
      initBatchList();
    }
  }, []);

  // 初始化批量添加列表
  const initBatchList = () => {
    setBatchShelfList([
      {
        key: '1',
        areaId: '',
        shelfName: '',
        shelfCode: '',
        status: 1,
        codeValid: true,
        nameValid: true,
      },
    ]);
  };

  // 添加一行批量货架
  const addBatchRow = () => {
    const newKey = Date.now().toString();
    
    // 获取最后一行的区域ID
    const lastItem = batchShelfList[batchShelfList.length - 1];
    const lastAreaId = lastItem?.areaId || '';
    
    setBatchShelfList([
      ...batchShelfList,
      {
        key: newKey,
        areaId: lastAreaId, // 使用上一行的区域ID
        shelfName: '',
        shelfCode: '',
        status: 1,
        codeValid: true,
        nameValid: true,
      },
    ]);
  };

  // 删除一行批量货架
  const removeBatchRow = (key: string) => {
    setBatchShelfList(batchShelfList.filter(item => item.key !== key));
  };

  // 更新批量货架数据
  const updateBatchItem = (key: string, field: string, value: any) => {
    setBatchShelfList(
      batchShelfList.map(item => {
        if (item.key === key) {
          const updatedItem = { ...item, [field]: value };

          // 当区域、货架名称或编码变更时，重置校验状态
          if (field === 'areaId' || field === 'shelfName' || field === 'shelfCode') {
            updatedItem.codeValid = field === 'shelfCode' ? undefined : item.codeValid;
            updatedItem.nameValid = field === 'shelfName' ? undefined : item.nameValid;
            updatedItem.codeError = field === 'shelfCode' ? undefined : item.codeError;
            updatedItem.nameError = field === 'shelfName' ? undefined : item.nameError;
          }
          return updatedItem;
        }
        return item;
      })
    );

    // 当用户输入完成后进行校验
    if (field === 'shelfName' || field === 'shelfCode') {
      const currentItem = batchShelfList.find(item => item.key === key);
      if (currentItem && currentItem.areaId && value) {
        if (field === 'shelfName') {
          validateShelfName(key, value, currentItem.areaId);
        } else if (field === 'shelfCode') {
          validateShelfCode(key, value, currentItem.areaId);
        }
      }
    }
  };

  // 校验货架编码
  const validateShelfCode = async (key: string, code: string, areaId: string) => {
    if (!code || !areaId) return;

    try {
      // 首先检查批量表格内部是否有重复的编码
      const duplicateInBatch = batchShelfList.find(
        item => item.key !== key && item.areaId === areaId && item.shelfCode === code
      );
      
      if (duplicateInBatch) {
        updateItemValidation(key, 'code', false, '批量添加中已存在相同编码');
        return;
      }

      // 检查与数据库中的编码是否重复
      const res = await checkShelfCode(areaId, code);
      if (res.code === 200) {
        if (res.data === false) {
          // 编码不存在，可以使用
          updateItemValidation(key, 'code', true);
        } else {
          // 编码已存在
          updateItemValidation(key, 'code', false, '货架编码已存在');
        }
      } else {
        updateItemValidation(key, 'code', false, res.msg || '校验货架编码失败');
      }
    } catch (error) {
      console.error('校验货架编码出错:', error);
      updateItemValidation(key, 'code', false, '校验货架编码出错');
    }
  };

  // 校验货架名称
  const validateShelfName = async (key: string, name: string, areaId: string) => {
    if (!name || !areaId) return;

    try {
      // 首先检查批量表格内部是否有重复的名称
      const duplicateInBatch = batchShelfList.find(
        item => item.key !== key && item.areaId === areaId && item.shelfName === name
      );
      
      if (duplicateInBatch) {
        updateItemValidation(key, 'name', false, '批量添加中已存在相同名称');
        return;
      }

      // 检查与数据库中的名称是否重复
      const res = await checkShelfName(areaId, name);
      if (res.code === 200) {
        if (res.data === false) {
          // 名称不存在，可以使用
          updateItemValidation(key, 'name', true);
        } else {
          // 名称已存在
          updateItemValidation(key, 'name', false, '货架名称已存在');
        }
      } else {
        updateItemValidation(key, 'name', false, res.msg || '校验货架名称失败');
      }
    } catch (error) {
      console.error('校验货架名称出错:', error);
      updateItemValidation(key, 'name', false, '校验货架名称出错');
    }
  };

  // 更新项目的验证状态
  const updateItemValidation = (key: string, field: 'code' | 'name', isValid: boolean, errorMsg?: string) => {
    setBatchShelfList(prevList => 
      prevList.map(item => {
        if (item.key === key) {
          if (field === 'code') {
            return {
              ...item,
              codeValid: isValid,
              codeError: errorMsg,
            };
          } else {
            return {
              ...item,
              nameValid: isValid,
              nameError: errorMsg,
            };
          }
        }
        return item;
      })
    );
  };

  // 验证所有项目
  const validateAllItems = async (): Promise<boolean> => {
    setValidating(true);
    
    try {
      // 检查是否有未填写的必填字段
      const incompleteItems = batchShelfList.filter(
        item => !item.areaId || !item.shelfName || !item.shelfCode
      );
      
      if (incompleteItems.length > 0) {
        message.error('请完善所有货架信息');
        return false;
      }

      // 对所有项进行校验
      const validationPromises = batchShelfList.flatMap(item => [
        validateShelfName(item.key, item.shelfName, item.areaId),
        validateShelfCode(item.key, item.shelfCode, item.areaId)
      ]);

      await Promise.all(validationPromises);

      // 检查是否全部校验通过
      const allValid = batchShelfList.every(
        item => item.codeValid !== false && item.nameValid !== false
      );

      if (!allValid) {
        message.error('存在重复的货架名称或编码，请修改后重试');
        return false;
      }

      return true;
    } catch (error) {
      console.error('批量校验出错:', error);
      message.error('校验出错，请重试');
      return false;
    } finally {
      setValidating(false);
    }
  };

  // 批量提交处理
  const handleBatchSubmit = async () => {
    // 先验证所有项
    const isValid = await validateAllItems();
    if (!isValid) return;
    
    // 准备提交数据
    const shelves: BatchShelfData[] = batchShelfList.map(item => ({
      areaId: item.areaId,
      shelfName: item.shelfName,
      shelfCode: item.shelfCode,
      status: item.status,
    }));
    
    await onSubmit(shelves);
  };

  // 批量添加表格列
  const batchColumns = [
    {
      title: '区域',
      dataIndex: 'areaId',
      key: 'areaId',
      render: (_: any, record: BatchShelfItem) => (
        <Select
          placeholder="请选择区域"
          style={{ width: '100%' }}
          value={record.areaId || undefined}
          onChange={(value) => updateBatchItem(record.key, 'areaId', value)}
        >
          {areaList.map(area => (
            <Option key={area.id} value={area.id}>{area.areaName}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '货架名称',
      dataIndex: 'shelfName',
      key: 'shelfName',
      render: (_: any, record: BatchShelfItem) => (
        <div>
          <Input
            placeholder="请输入货架名称"
            value={record.shelfName}
            onChange={(e) => updateBatchItem(record.key, 'shelfName', e.target.value)}
            status={record.nameValid === false ? 'error' : ''}
          />
          {record.nameValid === false && record.nameError && (
            <div style={{ color: 'red', fontSize: '12px' }}>{record.nameError}</div>
          )}
        </div>
      ),
    },
    {
      title: '货架编码',
      dataIndex: 'shelfCode',
      key: 'shelfCode',
      render: (_: any, record: BatchShelfItem) => (
        <div>
          <Input
            placeholder="请输入货架编码"
            value={record.shelfCode}
            onChange={(e) => updateBatchItem(record.key, 'shelfCode', e.target.value)}
            status={record.codeValid === false ? 'error' : ''}
          />
          {record.codeValid === false && record.codeError && (
            <div style={{ color: 'red', fontSize: '12px' }}>{record.codeError}</div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: BatchShelfItem) => (
        <Select
          value={record.status}
          onChange={(value) => updateBatchItem(record.key, 'status', value)}
          style={{ width: '100%' }}
        >
          <Option value={1}>启用</Option>
          <Option value={0}>禁用</Option>
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BatchShelfItem) => (
        <Button
          type="link"
          danger
          disabled={batchShelfList.length <= 1}
          onClick={() => removeBatchRow(record.key)}
          icon={<MinusCircleOutlined />}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Text>
          请填写需要批量添加的货架信息，确认无误后点击提交按钮。
        </Typography.Text>
        <Button 
          type="primary" 
          icon={<PlusCircleOutlined />} 
          onClick={addBatchRow}
        >
          新增一行
        </Button>
      </div>
      
      <Table
        rowKey="key"
        columns={batchColumns}
        dataSource={batchShelfList}
        pagination={false}
        size="middle"
        bordered
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button 
            type="primary" 
            onClick={handleBatchSubmit} 
            loading={loading || validating}
          >
            批量添加
          </Button>
        </Space>
      </div>
    </div>
  );
});

export default ShelfBatchForm; 