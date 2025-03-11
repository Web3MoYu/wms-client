import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  message,
  Typography,
  Alert,
  Switch,
} from 'antd';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Area } from '../../../api/location-service/AreaController';
import {
  Shelf,
  getShelfListByAreaId,
} from '../../../api/location-service/ShelfController';
import {
  Storage,
  checkStorageExists,
} from '../../../api/location-service/StorageController';
import {
  searchProducts,
  Product,
} from '../../../api/product-service/ProductController';
import debounce from 'lodash/debounce';

const { Option } = Select;
const { Text } = Typography;

// 批量添加的库位项接口
interface BatchStorageItem
  extends Omit<Storage, 'id' | 'createTime' | 'updateTime'> {
  key: string;
  codeValid?: boolean;
  codeError?: string;
  validateStatus?: 'success' | 'error' | 'validating' | '';
  areaCode?: string;
  shelfCode?: string;
}

// 批量添加提交数据接口
type BatchStorageData = Pick<
  Storage,
  'areaId' | 'shelfId' | 'locationCode' | 'locationName' | 'status'
>;

// 导出BatchFormRef类型，提供给父组件
export interface BatchFormRef {
  resetBatchForm: () => void;
}

interface StorageBatchFormProps {
  areaList: Area[];
  onSubmit: (storages: BatchStorageData[]) => Promise<void>;
  loading: boolean;
}

const StorageBatchForm = forwardRef<BatchFormRef, StorageBatchFormProps>(
  ({ areaList, onSubmit, loading }, ref) => {
    const [batchStorageList, setBatchStorageList] = useState<
      BatchStorageItem[]
    >([]);
    const [validating, setValidating] = useState<boolean>(false);
    const [shelvesByArea, setShelvesByArea] = useState<Record<string, Shelf[]>>(
      {}
    );
    const [areaCodes, setAreaCodes] = useState<Record<string, string>>({});
    const [shelfCodes, setShelfCodes] = useState<Record<string, string>>({});
    const [products, setProducts] = useState<Record<string, Product[]>>({});
    const [autoIncrement, setAutoIncrement] = useState<boolean>(false);

    // 对外暴露的方法
    useImperativeHandle(ref, () => ({
      resetBatchForm: () => {
        initBatchList();
      },
    }));

    // 初始化一行数据
    useEffect(() => {
      // 组件挂载时需要初始化
      if (batchStorageList.length === 0) {
        initBatchList();
      }

      // 初始化区域代码映射
      const codeMap: Record<string, string> = {};
      areaList.forEach((area) => {
        codeMap[area.id] = area.areaCode;
      });
      setAreaCodes(codeMap);
    }, [areaList]);

    // 初始化批量添加列表
    const initBatchList = () => {
      setBatchStorageList([
        {
          key: '1',
          areaId: '',
          shelfId: '',
          locationCode: '',
          locationName: '',
          status: 1,
          productId: '',
          codeValid: true,
        },
      ]);
    };

    // 获取货架列表
    const fetchShelfList = useCallback(
      async (areaId: string) => {
        if (!areaId) return;

        // 如果已经加载过，则不再重新加载
        if (shelvesByArea[areaId]) return;

        try {
          const res = await getShelfListByAreaId(areaId);
          if (res.code === 200) {
            // 更新货架列表
            setShelvesByArea((prev) => ({
              ...prev,
              [areaId]: res.data,
            }));

            // 更新货架代码映射
            const newShelfCodes: Record<string, string> = { ...shelfCodes };
            res.data.forEach((shelf: Shelf) => {
              newShelfCodes[shelf.id] = shelf.shelfCode;
            });
            setShelfCodes(newShelfCodes);
          }
        } catch (error) {
          console.error('获取货架列表失败:', error);
        }
      },
      [shelvesByArea, shelfCodes]
    );

    // 添加一行批量库位
    const addBatchRow = () => {
      const newKey = Date.now().toString();

      // 获取最后一行的区域ID和货架ID
      const lastItem = batchStorageList[batchStorageList.length - 1];
      const lastAreaId = lastItem?.areaId || '';
      const lastShelfId = lastItem?.shelfId || '';

      let newLocationCode = '';

      // 如果启用了自动递增且上一行有编码，则生成递增的编码
      if (autoIncrement && lastItem?.locationCode) {
        // 尝试从编码中提取数字部分
        const match = lastItem.locationCode.match(/(\D*)(\d+)(\D*)/);
        if (match) {
          const prefix = match[1];
          const number = parseInt(match[2], 10);
          const suffix = match[3];
          // 数字部分加1
          const newNumber = number + 1;
          // 保持相同的数字长度（前导零）
          const paddedNumber = newNumber
            .toString()
            .padStart(match[2].length, '0');
          newLocationCode = `${prefix}${paddedNumber}${suffix}`;
        } else {
          // 如果编码中没有数字，简单地添加1
          newLocationCode = `${lastItem.locationCode}1`;
        }
      }

      // 获取区域和货架的编码
      const areaCode = lastAreaId ? areaCodes[lastAreaId] : '';
      const shelfCode = lastShelfId ? shelfCodes[lastShelfId] : '';

      // 生成库位名称
      let newLocationName = '';
      if (areaCode && shelfCode && newLocationCode) {
        // 格式: 区域编码-货架编码-库位编码
        newLocationName = `${areaCode}-${shelfCode}-${newLocationCode}`;
      }

      setBatchStorageList([
        ...batchStorageList,
        {
          key: newKey,
          areaId: lastAreaId, // 使用上一行的区域ID
          shelfId: lastShelfId, // 使用上一行的货架ID
          locationCode: newLocationCode,
          locationName: newLocationName,
          status: 1,
          productId: '',
          codeValid: true,
          areaCode: areaCode,
          shelfCode: shelfCode,
        },
      ]);
    };

    // 删除一行批量库位
    const removeBatchRow = (key: string) => {
      setBatchStorageList(batchStorageList.filter((item) => item.key !== key));
    };

    // 当选择区域时
    const handleAreaChange = async (key: string, areaId: string) => {
      // 获取区域编码
      const areaCode = areaCodes[areaId] || '';

      // 获取该区域下的货架列表
      await fetchShelfList(areaId);

      // 更新库位信息
      setBatchStorageList(
        batchStorageList.map((item) => {
          if (item.key === key) {
            return {
              ...item,
              areaId,
              shelfId: '', // 清空货架选择
              areaCode,
              shelfCode: '',
              locationName: '', // 清空库位名称
            };
          }
          return item;
        })
      );
    };

    // 当选择货架时
    const handleShelfChange = (key: string, shelfId: string) => {
      // 获取货架编码
      const shelfCode = shelfCodes[shelfId] || '';

      // 更新库位信息
      setBatchStorageList(
        batchStorageList.map((item) => {
          if (item.key === key) {
            const newItem = {
              ...item,
              shelfId,
              shelfCode,
            };

            // 如果已经有了库位编码，更新库位名称
            if (newItem.locationCode && newItem.areaCode) {
              newItem.locationName = `${newItem.areaCode}-${shelfCode}-${newItem.locationCode}`;
            }

            return newItem;
          }
          return item;
        })
      );
    };

    // 更新批量库位数据
    const updateBatchItem = (key: string, field: string, value: any) => {
      setBatchStorageList(
        batchStorageList.map((item) => {
          if (item.key === key) {
            const updatedItem = { ...item, [field]: value };

            // 当库位编码变更时，更新库位名称并重置校验状态
            if (field === 'locationCode') {
              if (updatedItem.areaCode && updatedItem.shelfCode && value) {
                updatedItem.locationName = `${updatedItem.areaCode}-${updatedItem.shelfCode}-${value}`;
              }
              updatedItem.codeValid = undefined;
              updatedItem.codeError = undefined;
            }

            return updatedItem;
          }
          return item;
        })
      );

      // 当用户输入库位编码完成后进行校验
      if (field === 'locationCode') {
        const currentItem = batchStorageList.find((item) => item.key === key);
        if (currentItem && currentItem.areaId && currentItem.shelfId && value) {
          validateLocationCode(
            key,
            value,
            currentItem.shelfId,
            currentItem.areaId
          );
        }
      }
    };

    // 校验库位编码
    const validateLocationCode = async (
      key: string,
      code: string,
      shelfId: string,
      areaId: string
    ) => {
      if (!code || !shelfId || !areaId) return;

      try {
        // 首先检查批量表格内部是否有重复的编码
        const duplicateInBatch = batchStorageList.find(
          (item) =>
            item.key !== key &&
            item.shelfId === shelfId &&
            item.areaId === areaId &&
            item.locationCode === code
        );

        if (duplicateInBatch) {
          updateItemValidation(key, false, '批量添加中已存在相同编码');
          return;
        }

        // 检查与数据库中的编码是否重复
        const res = await checkStorageExists(code, shelfId, areaId);
        if (res.code === 200) {
          if (res.data === false) {
            // 编码不存在，可以使用
            updateItemValidation(key, true);
          } else {
            // 编码已存在
            updateItemValidation(key, false, '库位编码已存在');
            message.error('库位编码已存在，请修改后重试！');
          }
        } else {
          updateItemValidation(key, false, res.msg || '校验库位编码失败');
        }
      } catch (error) {
        console.error('校验库位编码出错:', error);
        updateItemValidation(key, false, '校验库位编码出错');
      }
    };

    // 更新项目的验证状态
    const updateItemValidation = (
      key: string,
      isValid: boolean,
      errorMsg?: string
    ) => {
      setBatchStorageList((prevList) =>
        prevList.map((item) => {
          if (item.key === key) {
            return {
              ...item,
              codeValid: isValid,
              codeError: errorMsg,
            };
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
        const incompleteItems = batchStorageList.filter(
          (item) => !item.areaId || !item.shelfId || !item.locationCode
        );

        if (incompleteItems.length > 0) {
          message.error('请完善所有库位信息');
          return false;
        }

        // 对所有项进行校验
        const validationPromises = batchStorageList.map((item) =>
          validateLocationCode(
            item.key,
            item.locationCode,
            item.shelfId,
            item.areaId
          )
        );

        await Promise.all(validationPromises);

        // 检查是否全部校验通过
        const allValid = batchStorageList.every(
          (item) => item.codeValid !== false
        );

        if (!allValid) {
          message.error('存在库位编码校验不通过，请修正后再提交');
        }

        return allValid;
      } catch (error) {
        console.error('批量验证出错:', error);
        message.error('验证时发生错误');
        return false;
      } finally {
        setValidating(false);
      }
    };

    // 处理提交批量库位
    const handleBatchSubmit = async () => {
      try {
        const isValid = await validateAllItems();
        if (!isValid) return;

        // 准备提交数据
        const storageData: BatchStorageData[] = batchStorageList.map(
          (item) => ({
            areaId: item.areaId,
            shelfId: item.shelfId,
            locationCode: item.locationCode,
            locationName: item.locationName,
            status: item.status,
            productId: item.productId || '',
          })
        );

        // 提交到父组件
        await onSubmit(storageData);

        // 成功后重置表单
        initBatchList();
      } catch (error) {
        console.error('批量提交出错:', error);
      }
    };

    // 显示校验错误信息
    const expandedRowRender = (record: BatchStorageItem) => {
      if (record.codeError) {
        return (
          <div style={{ margin: '0 0 0 48px' }}>
            <Text type='danger'>{record.codeError}</Text>
          </div>
        );
      }
      return null;
    };

    // 模糊搜索产品
    const handleProductSearch = debounce(
      async (key: string, productName: string) => {
        if (!productName || productName.length < 1) {
          // 清空当前行的产品列表
          setProducts((prev) => ({ ...prev, [key]: [] }));
          return;
        }

        try {
          const res = await searchProducts(productName);
          if (res.code === 200) {
            // 为当前行设置产品列表
            setProducts((prev) => ({ ...prev, [key]: res.data }));
          }
        } catch (error) {
          console.error('搜索产品失败:', error);
        }
      },
      500
    );

    // 定义表格列
    const columns = [
      {
        title: '序号',
        width: 60,
        render: (_: any, _record: any, index: number) => index + 1,
      },
      {
        title: (
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>所属区域
          </Space>
        ),
        dataIndex: 'areaId',
        key: 'areaId',
        width: 180,
        render: (areaId: string, record: BatchStorageItem) => (
          <Select
            placeholder='请选择区域'
            style={{ width: '100%' }}
            value={areaId || undefined}
            onChange={(value) => handleAreaChange(record.key, value)}
          >
            {areaList.map((area) => (
              <Option key={area.id} value={area.id}>
                {area.areaName}
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: (
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>所属货架
          </Space>
        ),
        dataIndex: 'shelfId',
        key: 'shelfId',
        width: 180,
        render: (shelfId: string, record: BatchStorageItem) => (
          <Select
            placeholder='请选择货架'
            style={{ width: '100%' }}
            value={shelfId || undefined}
            disabled={!record.areaId}
            onChange={(value) => handleShelfChange(record.key, value)}
          >
            {(shelvesByArea[record.areaId] || []).map((shelf) => (
              <Option key={shelf.id} value={shelf.id}>
                {shelf.shelfName}
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: (
          <Space>
            <span style={{ color: '#ff4d4f' }}>*</span>库位编码
          </Space>
        ),
        dataIndex: 'locationCode',
        key: 'locationCode',
        width: 180,
        render: (code: string, record: BatchStorageItem) => (
          <Input
            placeholder='请输入库位编码'
            value={code}
            status={record.codeValid === false ? 'error' : ''}
            disabled={!record.areaId || !record.shelfId}
            onChange={(e) =>
              updateBatchItem(record.key, 'locationCode', e.target.value)
            }
            addonBefore={
              record.areaCode && record.shelfCode
                ? `${record.areaCode}-${record.shelfCode}-`
                : '请先选择区域和货架'
            }
          />
        ),
      },
      {
        title: '库位名称',
        dataIndex: 'locationName',
        key: 'locationName',
        width: 250,
        render: (name: string) => (
          <Input value={name} disabled placeholder='自动生成的库位名称' />
        ),
      },
      {
        title: '产品',
        dataIndex: 'productId',
        key: 'productId',
        width: 200,
        render: (productId: string, record: BatchStorageItem) => (
          <Select
            placeholder='请输入产品名称搜索'
            allowClear
            showSearch
            filterOption={false}
            value={productId}
            style={{ width: '100%' }}
            onSearch={(value) => handleProductSearch(record.key, value)}
            onChange={(value) =>
              updateBatchItem(record.key, 'productId', value)
            }
          >
            {(products[record.key] || []).map((product) => (
              <Option key={product.id} value={product.id}>
                {product.productName}
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (_: any, item: BatchStorageItem) => (
          <Select
            value={item.status}
            onChange={(value) => updateBatchItem(item.key, 'status', value)}
            style={{ width: '100%' }}
          >
            <Option value={1}>空闲</Option>
            <Option value={2}>禁用</Option>
          </Select>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_: any, record: BatchStorageItem) => (
          <Button
            type='text'
            danger
            icon={<MinusCircleOutlined />}
            onClick={() => removeBatchRow(record.key)}
            disabled={batchStorageList.length <= 1}
          />
        ),
      },
    ];

    return (
      <div>
        <Alert
          message='批量添加说明'
          description={
            <ul>
              <li>所有带 * 的字段均为必填项</li>
              <li>库位编码将与区域编码和货架编码组合，自动生成库位名称</li>
              <li>添加新行时会自动使用上一行的区域和货架</li>
              <li>开启自动递增后，新添加的行将自动递增上一行的库位编码</li>
            </ul>
          }
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>自动递增编码：</span>
            <Switch
              checked={autoIncrement}
              onChange={(checked) => setAutoIncrement(checked)}
            />
            <Button icon={<PlusCircleOutlined />} onClick={addBatchRow}>
              添加一行
            </Button>
          </Space>
        </div>

        <Table
          dataSource={batchStorageList}
          columns={columns}
          rowKey='key'
          pagination={false}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            expandIconColumnIndex: -1, // 隐藏展开图标列
            rowExpandable: (record) => Boolean(record.codeError),
          }}
          scroll={{ x: 'max-content' }}
        />

        <div
          style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            type='primary'
            onClick={handleBatchSubmit}
            loading={loading || validating}
          >
            批量提交
          </Button>
        </div>
      </div>
    );
  }
);

export default StorageBatchForm;
