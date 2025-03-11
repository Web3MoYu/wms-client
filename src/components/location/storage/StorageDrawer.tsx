import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer, Button, Space, Tabs, message } from 'antd';
import { Area } from '../../../api/location-service/AreaController';
import { Shelf, getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import { 
  Storage, 
  addStorage, 
  updateStorage, 
  addBatchStorage, 
  checkStorageExists 
} from '../../../api/location-service/StorageController';
import StorageForm from './StorageForm';
import StorageBatchForm, { BatchFormRef } from './StorageBatchForm';

const { TabPane } = Tabs;

interface DrawerProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
  areaList: Area[];
  editingStorage: Storage | null;
  drawerForm: any;
}

const StorageDrawer: React.FC<DrawerProps> = ({
  visible,
  title,
  onClose,
  onSuccess,
  areaList,
  editingStorage,
  drawerForm,
}) => {
  const [activeKey, setActiveKey] = useState('1');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [shelfList, setShelfList] = useState<Shelf[]>([]);
  const [areaCode, setAreaCode] = useState<string>('');
  const [shelfCode, setShelfCode] = useState<string>('');
  const batchFormRef = useRef<BatchFormRef>(null);

  // 是否为新增模式（非编辑模式）
  const isAddMode = !editingStorage;

  // 监听抽屉打开状态和编辑状态的变化
  useEffect(() => {
    // 当抽屉打开并且是新增模式时，重置批量表单
    if (visible && isAddMode && batchFormRef.current) {
      batchFormRef.current.resetBatchForm();
    }

    // 当打开编辑模式时，加载货架列表和编码信息
    if (visible && !isAddMode && editingStorage) {
      loadShelfListByAreaId(editingStorage.areaId);
      loadCodeInfo();
    }

    // 当打开编辑模式或抽屉关闭时，确保activeKey重置为1
    if ((!isAddMode && visible) || !visible) {
      setActiveKey('1');
    }
  }, [visible, isAddMode, editingStorage]);

  // 加载编码信息
  const loadCodeInfo = useCallback(async () => {
    if (!editingStorage) return;
    
    // 获取区域编码
    const area = areaList.find(a => a.id === editingStorage.areaId);
    if (area) {
      setAreaCode(area.areaCode);
    }
    
    // 获取货架列表
    if (editingStorage.areaId) {
      try {
        const res = await getShelfListByAreaId(editingStorage.areaId);
        if (res.code === 200) {
          setShelfList(res.data);
          
          // 获取货架编码
          const shelf = res.data.find((s: Shelf) => s.id === editingStorage.shelfId);
          if (shelf) {
            setShelfCode(shelf.shelfCode);
          }
        }
      } catch (error) {
        console.error('获取货架列表失败:', error);
      }
    }
  }, [editingStorage, areaList]);

  // 加载指定区域下的货架列表
  const loadShelfListByAreaId = async (areaId: string) => {
    if (!areaId) {
      setShelfList([]);
      return;
    }
    
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelfList(res.data);
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
    }
  };

  // 处理区域变更
  const handleAreaChange = (areaId: string) => {
    // 获取区域编码
    const area = areaList.find(a => a.id === areaId);
    if (area) {
      setAreaCode(area.areaCode);
    } else {
      setAreaCode('');
    }
    
    // 清空货架相关信息
    drawerForm.setFieldsValue({ shelfId: undefined, locationCode: '', locationName: '' });
    setShelfCode('');
    
    // 加载货架列表
    loadShelfListByAreaId(areaId);
  };

  // 处理货架变更
  const handleShelfChange = (shelfId: string) => {
    // 获取货架编码
    const shelf = shelfList.find(s => s.id === shelfId);
    if (shelf) {
      setShelfCode(shelf.shelfCode);
      
      // 如果已经有库位编码，更新库位名称
      const locationCode = drawerForm.getFieldValue('locationCode');
      if (locationCode && areaCode) {
        drawerForm.setFieldsValue({
          locationName: `${areaCode}-${shelf.shelfCode}-${locationCode}`
        });
      }
    } else {
      setShelfCode('');
    }
    
    // 清空库位名称
    if (!shelfId) {
      drawerForm.setFieldsValue({ locationName: '' });
    }
  };

  // 自定义关闭函数，确保关闭前重置状态
  const handleClose = () => {
    setActiveKey('1'); // 确保下次打开时默认是单个添加模式
    onClose();
  };

  // 校验库位编码
  const validateLocationCode = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    const areaId = drawerForm.getFieldValue('areaId');
    const shelfId = drawerForm.getFieldValue('shelfId');
    if (!areaId) return Promise.reject(new Error('请先选择区域'));
    if (!shelfId) return Promise.reject(new Error('请先选择货架'));
    
    try {
      // 如果是编辑状态且编码未修改，则不需要校验
      if (editingStorage && 
          editingStorage.locationCode === value && 
          editingStorage.areaId === areaId &&
          editingStorage.shelfId === shelfId) {
        return Promise.resolve();
      }
      
      // 检查与数据库中的编码是否重复
      const res = await checkStorageExists(value, shelfId, areaId);
      if (res.code === 200) {
        if (res.data === false) {
          // 编码不存在，可以使用
          return Promise.resolve();
        } else {
          // 编码已存在
          message.error('库位编码已存在，请修改后重试！');
          return Promise.reject(new Error('该货架下已存在相同的库位编码'));
        }
      } else {
        message.error(res.msg || '校验库位编码失败');
        return Promise.reject(new Error(res.msg || '校验库位编码失败'));
      }
    } catch (error) {
      console.error('校验库位编码出错:', error);
      message.error('校验库位编码出错，请稍后重试');
      return Promise.reject(new Error('校验库位编码出错'));
    }
  };

  // 提交单个库位表单
  const handleSubmitForm = async () => {
    try {
      const values = await drawerForm.validateFields();
      
      // 如果用户没有输入locationName（自动生成的），则根据编码生成
      if (!values.locationName && values.locationCode && areaCode && shelfCode) {
        values.locationName = `${areaCode}-${shelfCode}-${values.locationCode}`;
      }
      
      // 转换状态值
      const storageData: Storage = {
        ...values,
        status: values.status ? 1 : 2, // true对应空闲(1)，false对应禁用(2)
        productId: values.productId || '', // 确保productId有值
      };

      // 移除时间字段
      delete (storageData as any).createTime;
      delete (storageData as any).updateTime;
      // 移除productName字段，因为这是通过API获取的，不需要提交
      delete (storageData as any).productName;

      let res;
      
      if (editingStorage?.id) {
        // 更新操作
        storageData.id = editingStorage.id;
        res = await updateStorage(editingStorage.id, storageData);
      } else {
        // 新增操作
        res = await addStorage(storageData);
      }

      if (res.code === 200) {
        message.success(res.msg || (editingStorage ? '更新库位成功' : '新增库位成功'));
        onSuccess();
      } else {
        message.error(res.msg || (editingStorage ? '更新库位失败' : '新增库位失败'));
      }
    } catch (error: any) {
      console.error('提交表单出错:', error);
      // 检查是否是表单验证错误
      if (error.errorFields) {
        // 获取第一个错误信息
        const firstError = error.errorFields[0];
        message.error(`表单验证失败: ${firstError.errors[0]}`);
      }
    }
  };

  // 处理批量添加
  const handleBatchSubmit = async (storages: any[]) => {
    try {
      setBatchSubmitting(true);
      
      const res = await addBatchStorage(storages);
      if (res.code === 200) {
        message.success(res.msg || '批量添加库位成功');
        onSuccess();
      } else {
        message.error(res.msg || '批量添加库位失败');
      }
    } catch (error) {
      console.error('批量添加库位出错:', error);
      message.error('批量添加库位失败');
      throw error;
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <Drawer
      title={title}
      width={activeKey === '2' && isAddMode ? 1100 : 520}
      placement="right"
      onClose={handleClose}
      open={visible}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            {/* 仅在单条添加模式下显示表单提交按钮 */}
            {(activeKey === '1' || !isAddMode) && (
              <Button 
                type="primary" 
                onClick={handleSubmitForm}
              >
                提交
              </Button>
            )}
          </Space>
        </div>
      }
    >
      {isAddMode ? (
        // 新增模式：显示选项卡
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          style={{ marginBottom: 20 }}
        >
          <TabPane tab="单个添加" key="1">
            <StorageForm
              form={drawerForm}
              areaList={areaList}
              shelfList={shelfList}
              editingStorage={editingStorage}
              validateLocationCode={validateLocationCode}
              onAreaChange={handleAreaChange}
              onShelfChange={handleShelfChange}
              areaCode={areaCode}
              shelfCode={shelfCode}
            />
          </TabPane>
          <TabPane tab="批量添加" key="2">
            <StorageBatchForm
              ref={batchFormRef}
              areaList={areaList}
              onSubmit={handleBatchSubmit}
              loading={batchSubmitting}
            />
          </TabPane>
        </Tabs>
      ) : (
        // 编辑模式：仅显示单个表单
        <StorageForm
          form={drawerForm}
          areaList={areaList}
          shelfList={shelfList}
          editingStorage={editingStorage}
          validateLocationCode={validateLocationCode}
          onAreaChange={handleAreaChange}
          onShelfChange={handleShelfChange}
          areaCode={areaCode}
          shelfCode={shelfCode}
        />
      )}
    </Drawer>
  );
};

export default StorageDrawer; 