import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Button, Space, Tabs, message } from 'antd';
import { Area } from '../../../api/location-service/AreaController';
import { Shelf, addShelf, updateShelf, addShelfBatch } from '../../../api/location-service/ShelfController';
import ShelfForm from './ShelfForm';
import ShelfBatchForm, { BatchFormRef } from './ShelfBatchForm';

const { TabPane } = Tabs;

interface DrawerProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
  areaList: Area[];
  editingShelf: Shelf | null;
  validateShelfCode: (rule: any, value: string) => Promise<void>;
  validateShelfName: (rule: any, value: string) => Promise<void>;
  drawerForm: any;
}

const ShelfDrawer: React.FC<DrawerProps> = ({
  visible,
  title,
  onClose,
  onSuccess,
  areaList,
  editingShelf,
  validateShelfCode,
  validateShelfName,
  drawerForm,
}) => {
  const [activeKey, setActiveKey] = useState('1');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const batchFormRef = useRef<BatchFormRef>(null);

  // 是否为新增模式（非编辑模式）
  const isAddMode = !editingShelf;

  // 监听抽屉打开状态和编辑状态的变化
  useEffect(() => {
    // 当抽屉打开并且是新增模式时，重置批量表单
    if (visible && isAddMode && batchFormRef.current) {
      batchFormRef.current.resetBatchForm();
    }

    // 当打开编辑模式或抽屉关闭时，确保activeKey重置为1
    if ((!isAddMode && visible) || !visible) {
      setActiveKey('1');
    }
  }, [visible, isAddMode]);

  // 自定义关闭函数，确保关闭前重置状态
  const handleClose = () => {
    setActiveKey('1'); // 确保下次打开时默认是单个添加模式
    onClose();
  };

  // 提交单个货架表单
  const handleSubmitForm = async () => {
    try {
      const values = await drawerForm.validateFields();
      
      // 转换状态值
      const shelfData: Shelf = {
        ...values,
        status: values.status ? 1 : 0,
      };

      // 移除时间字段
      delete (shelfData as any).createTime;
      delete (shelfData as any).updateTime;

      let res;
      
      if (editingShelf?.id) {
        // 更新操作
        shelfData.id = editingShelf.id;
        res = await updateShelf(shelfData);
      } else {
        // 新增操作
        res = await addShelf(shelfData);
      }

      if (res.code === 200) {
        message.success(editingShelf ? '更新货架成功' : '新增货架成功');
        onSuccess();
      } else {
        message.error(res.msg || (editingShelf ? '更新货架失败' : '新增货架失败'));
      }
    } catch (error) {
      console.error('提交表单出错:', error);
    }
  };

  // 处理批量添加
  const handleBatchSubmit = async (shelves: any[]) => {
    try {
      setBatchSubmitting(true);
      
      const res = await addShelfBatch(shelves as Shelf[]);
      if (res.code === 200) {
        message.success('批量添加货架成功');
        onSuccess();
      } else {
        message.error(res.msg || '批量添加货架失败');
      }
    } catch (error) {
      console.error('批量添加货架出错:', error);
      message.error('批量添加货架失败');
      throw error;
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <Drawer
      title={title}
      width={activeKey === '2' && isAddMode ? 900 : 520}
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
            <ShelfForm
              form={drawerForm}
              areaList={areaList}
              editingShelf={editingShelf}
              validateShelfCode={validateShelfCode}
              validateShelfName={validateShelfName}
            />
          </TabPane>
          <TabPane tab="批量添加" key="2">
            <ShelfBatchForm
              ref={batchFormRef}
              areaList={areaList}
              onSubmit={handleBatchSubmit}
              loading={batchSubmitting}
            />
          </TabPane>
        </Tabs>
      ) : (
        // 编辑模式：仅显示单个表单
        <ShelfForm
          form={drawerForm}
          areaList={areaList}
          editingShelf={editingShelf}
          validateShelfCode={validateShelfCode}
          validateShelfName={validateShelfName}
        />
      )}
    </Drawer>
  );
};

export default ShelfDrawer; 