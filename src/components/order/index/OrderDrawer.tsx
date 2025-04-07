import { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Tabs,
  Cascader,
  AutoComplete,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  insertOrderIn,
  OrderIn,
  OrderInItem,
} from '../../../api/order-service/OrderController';
import {
  searchProducts,
  Product,
  checkProductCode,
  generateBatchNumber,
} from '../../../api/product-service/ProductController';
import {
  getProductCatTree,
  ProductCatTree,
} from '../../../api/product-service/ProductCatController';
import { getBatchNumberByCode } from '../../../api/stock-service/StockController';
import { getUsersByName, User } from '../../../api/sys-service/UserController';
import OutboundOrderForm from './out/OutboundOrderForm';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 抽屉属性接口
interface OrderDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId: string; // 当前用户ID
}

// 为表单项创建唯一ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// 订单抽屉组件
const OrderDrawer: React.FC<OrderDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
  currentUserId,
}) => {
  // 状态定义
  const [activeTab, setActiveTab] = useState<string>('inbound');
  const [loading, setLoading] = useState<boolean>(false);
  const [orderInForm] = Form.useForm();
  const [orderOutForm] = Form.useForm();

  // 用户搜索相关状态
  const [approverOptions, setApproverOptions] = useState<User[]>([]);

  // 产品搜索相关状态
  const [productOptions, setProductOptions] = useState<Product[]>([]);

  // 批次号搜索相关状态
  const [batchNumberOptions, setBatchNumberOptions] = useState<string[]>([]);

  // 新增自定义产品编码校验状态
  const [productCodeValidating, setProductCodeValidating] = useState<
    Record<string, boolean>
  >({});
  const [productCodeValid, setProductCodeValid] = useState<
    Record<string, boolean>
  >({});
  const [productCodeError, setProductCodeError] = useState<
    Record<string, string>
  >({});

  // 添加分类树状态
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  // 添加产品选择状态跟踪
  const [selectedProducts, setSelectedProducts] = useState<
    Record<number, boolean>
  >({});

  // 添加已存在批次号状态跟踪
  const [existingBatchNumbers, setExistingBatchNumbers] = useState<
    Record<number, boolean>
  >({});

  // 添加批次号重复错误状态
  const [batchNumberErrors, setBatchNumberErrors] = useState<Record<number, string>>({});

  // 处理关闭抽屉的函数，清除表单数据后再关闭
  const handleClose = () => {
    // 重置所有表单数据
    orderInForm.resetFields();
    orderOutForm.resetFields();

    // 重置其他状态
    setProductOptions([]);
    setBatchNumberOptions([]);
    setProductCodeValidating({});
    setProductCodeValid({});
    setProductCodeError({});
    setSelectedProducts({});
    setExistingBatchNumbers({});
    setApproverOptions([]);
    setActiveTab('inbound'); // 重置回入库订单标签

    // 调用父组件传入的关闭函数
    onClose();
  };

  // 清空表单
  useEffect(() => {
    if (visible) {
      orderInForm.resetFields();
      orderOutForm.resetFields();

      // 设置默认值
      const defaultOrderItems = [
        {
          key: generateId(),
          productId: '',
          productName: '',
          productCode: '',
          expectedQuantity: 1,
          price: null,
          amount: 0,
          isCustomProduct: false,
          batchNumber: '',
          productionDate: null, // 改为null，让组件自己处理默认日期
          status: 0, // 待开始
          qualityStatus: 0, // 未质检
        },
      ];

      orderInForm.setFieldsValue({
        orderItems: defaultOrderItems,
        creatorId: currentUserId,
        orderType: 1, // 采购入库
        expectedTime: null, // 改为null，让组件自己处理默认日期
        status: 0, // 待审核
        qualityStatus: 0, // 未质检
      });

      orderOutForm.setFieldsValue({
        orderItems: defaultOrderItems,
        creatorId: currentUserId,
        orderType: 1, // 销售出库
        expectedTime: null,
        status: 0, // 待审核
        qualityStatus: 0, // 未质检
      });

      // 重置产品选择状态
      setSelectedProducts({});
      setBatchNumberOptions([]);
    }
  }, [visible, currentUserId, orderInForm, orderOutForm]);

  // 获取产品分类树
  useEffect(() => {
    if (visible) {
      fetchCategoryTree();
    }
  }, [visible]);

  // 获取产品分类树
  const fetchCategoryTree = async () => {
    try {
      const res = await getProductCatTree();
      if (res.code === 200) {
        // 将分类树转换为级联选择器需要的格式
        const formatCategoryTree = (items: ProductCatTree[]): any[] => {
          return items.map((item) => ({
            value: item.category.id,
            label: item.category.categoryName,
            children:
              item.children && item.children.length > 0
                ? formatCategoryTree(item.children)
                : undefined,
            isLeaf: !item.children || item.children.length === 0,
          }));
        };

        const options = formatCategoryTree(res.data);
        setCategoryOptions(options);
      } else {
        message.error(res.msg || '获取产品分类失败');
      }
    } catch (error) {
      console.error('获取产品分类失败:', error);
    }
  };

  // 自定义级联选择器显示
  const displayRender = (labels: string[]) => {
    return labels.join('-');
  };

  // 防抖搜索审批人
  const handleApproverSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setApproverOptions([]);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setApproverOptions(res.data);
      }
    } catch (error) {
      console.error('搜索审批人失败:', error);
    }
  }, 500);

  // 防抖搜索产品
  const handleProductSearch = debounce(async (productName: string) => {
    if (!productName || productName.length < 1) {
      setProductOptions([]);
      return;
    }

    try {
      const res = await searchProducts(productName);
      if (res.code === 200) {
        setProductOptions(res.data);
      }
    } catch (error) {
      console.error('搜索产品失败:', error);
    }
  }, 500);

  // 防抖搜索批次号
  const handleBatchNumberSearch = debounce(
    async (batchNumber: string, index: number, formName: string) => {
      if (!batchNumber || batchNumber.length < 1) {
        setBatchNumberOptions([]);
        return;
      }

      const form = formName === 'inbound' ? orderInForm : orderOutForm;

      // 检查是否已选择产品
      if (!selectedProducts[index]) {
        message.warning('请先选择产品');
        setBatchNumberOptions([]);
        return;
      }

      // 获取产品编码
      const productCode = form.getFieldValue([
        'orderItems',
        index,
        'productCode',
      ]);

      if (!productCode) {
        message.warning('产品编码获取失败，请重新选择产品');
        setBatchNumberOptions([]);
        return;
      }

      try {
        const res = await getBatchNumberByCode(productCode, batchNumber);
        if (res.code === 200 && res.data) {
          const batchList = Array.isArray(res.data)
            ? res.data
            : typeof res.data === 'string'
            ? res.data.split(',')
            : [String(res.data)];

          // 确保当前输入的批次号也在列表中
          if (batchNumber && !batchList.includes(batchNumber)) {
            batchList.unshift(batchNumber);
          }

          setBatchNumberOptions(batchList);
        } else {
          // 如果没有找到匹配的批次号，仍然允许用户使用当前输入的值
          setBatchNumberOptions([batchNumber]);
        }
      } catch (error) {
        console.error('搜索批次号失败:', error);
        setBatchNumberOptions([batchNumber]);
      }
    },
    500
  );

  // 处理产品选择
  const handleProductSelect = (
    productId: string,
    index: number,
    formName: string
  ) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const selectedProduct = productOptions.find((p) => p.id === productId);

    if (selectedProduct) {
      // 更新产品信息
      const orderItems = form.getFieldValue('orderItems');
      orderItems[index] = {
        ...orderItems[index],
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
        productCode: selectedProduct.productCode,
        price: selectedProduct.price || 0,
        isCustomProduct: false, // 标记为系统产品
        batchNumber: '', // 清空批次号
      };

      // 计算金额
      orderItems[index].amount =
        (orderItems[index].expectedQuantity || 0) *
        (orderItems[index].price || 0);

      form.setFieldsValue({
        orderItems,
      });

      // 更新产品选择状态
      setSelectedProducts((prev) => ({
        ...prev,
        [index]: true,
      }));

      // 重新计算总金额
      calculateTotals(formName);

      // 清空批次号选项
      setBatchNumberOptions([]);
    }
  };

  // 处理自定义产品切换
  const handleCustomProductChange = (
    isCustom: boolean,
    index: number,
    formName: string
  ) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const orderItems = form.getFieldValue('orderItems');

    // 保留原始数量和金额值
    const originalQuantity = orderItems[index].expectedQuantity || 1;

    if (isCustom) {
      // 切换为自定义产品
      orderItems[index] = {
        ...orderItems[index],
        productId: '', // 清空产品ID
        productName: '', // 清空产品名称
        productCode: '', // 清空产品编码
        brand: '', // 清空品牌
        model: '', // 清空型号
        spec: '', // 清空规格
        categoryId: undefined, // 清空分类
        price: null, // 重置价格
        amount: 0, // 重置金额
        isCustomProduct: true,
        batchNumber: '', // 清空批次号
        productionDate: null, // 清空生产日期
        remark: '', // 清空备注
        expectedQuantity: originalQuantity, // 保留原数量
      };

      // 更新产品选择状态 - 自定义产品也设置为已选择，这样可以输入批次号
      setSelectedProducts((prev) => ({
        ...prev,
        [index]: true,
      }));
    } else {
      // 切换为系统产品
      orderItems[index] = {
        ...orderItems[index],
        isCustomProduct: false,
        productId: '', // 确保清空产品ID
        productName: '', // 清空产品名称
        productCode: '', // 清空产品编码
        brand: '', // 清空品牌
        model: '', // 清空型号
        spec: '', // 清空规格
        categoryId: undefined, // 清空分类
        price: null, // 重置价格
        amount: 0, // 重置金额
        batchNumber: '', // 清空批次号
        productionDate: null, // 清空生产日期
        remark: '', // 清空备注
        expectedQuantity: originalQuantity, // 保留原数量
      };

      // 更新产品选择状态 - 系统产品需要选择后才能输入批次号
      setSelectedProducts((prev) => ({
        ...prev,
        [index]: false,
      }));
    }

    form.setFieldsValue({
      orderItems,
    });

    // 清空批次号选项
    setBatchNumberOptions([]);

    // 重置批次号存在状态
    setExistingBatchNumbers((prev) => ({
      ...prev,
      [index]: false,
    }));

    // 重置产品编码检验状态
    setProductCodeValid((prev) => ({
      ...prev,
      [index]: false,
    }));

    setProductCodeError((prev) => ({
      ...prev,
      [index]: '',
    }));
    
    // 显式重置产品编码字段的验证状态
    form.setFields([
      {
        name: ['orderItems', index, 'productCode'],
        errors: [],
        validating: false,
      }
    ]);

    // 重新计算总金额
    calculateTotals(formName);
  };

  // 处理数量或价格变化
  const handleQuantityOrPriceChange = (index: number, formName: string) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const orderItems = form.getFieldValue('orderItems');

    // 计算金额
    const quantity = orderItems[index].expectedQuantity || 0;
    const price = orderItems[index].price || 0;
    orderItems[index].amount = quantity * price;

    form.setFieldsValue({
      orderItems,
    });
  };

  // 计算总金额和总数量
  const calculateTotals = (formName: string) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const orderItems = form.getFieldValue('orderItems') || [];

    let totalAmount = 0;
    let totalQuantity = 0;

    orderItems.forEach((item: any) => {
      // 确保每个商品的金额都是使用当前的数量和单价重新计算
      const quantity = Number(item.expectedQuantity) || 0;
      const price = Number(item.price) || 0;
      const itemAmount = quantity * price;

      // 更新每个商品的金额
      item.amount = itemAmount;

      totalAmount += itemAmount;
      totalQuantity += quantity;
    });

    // 更新表单中的金额
    form.setFieldsValue({ orderItems });

    return {
      totalAmount,
      totalQuantity,
    };
  };

  // 处理自定义产品编码校验
  const handleProductCodeCheck = debounce(
    async (productCode: string, index: number) => {
      if (!productCode || productCode.length < 1) {
        return;
      }

      // 只有自定义产品才需要验证编码
      const isCustomProduct = orderInForm.getFieldValue([
        'orderItems',
        index,
        'isCustomProduct',
      ]);
      if (!isCustomProduct) {
        return;
      }

      try {
        setProductCodeValidating({ ...productCodeValidating, [index]: true });

        // 先检查表单内部是否有重复的产品编码
        const orderItems = orderInForm.getFieldValue('orderItems') || [];
        const duplicateIndex = orderItems.findIndex(
          (item: any, i: number) =>
            i !== index &&
            item.isCustomProduct &&
            item.productCode === productCode
        );

        if (duplicateIndex !== -1) {
          setProductCodeValid({ ...productCodeValid, [index]: false });
          setProductCodeError({
            ...productCodeError,
            [index]: '表单中已存在相同产品编码，请更换',
          });
          setProductCodeValidating({
            ...productCodeValidating,
            [index]: false,
          });
          return;
        }

        // 再检查系统中是否已存在该产品编码
        const res = await checkProductCode(productCode);

        if (res.code === 200) {
          // 如果返回 true，表示编码已存在
          const exists = res.data;

          if (exists) {
            setProductCodeValid({ ...productCodeValid, [index]: false });
            setProductCodeError({
              ...productCodeError,
              [index]: '产品编码已存在，请更换',
            });
          } else {
            setProductCodeValid({ ...productCodeValid, [index]: true });
            setProductCodeError({ ...productCodeError, [index]: '' });
          }
        }
      } catch (error) {
        console.error('检查产品编码失败:', error);
      } finally {
        setProductCodeValidating({ ...productCodeValidating, [index]: false });
      }
    },
    500
  );

  // 生成批次号
  const handleGenerateBatchNumber = async (index: number, formName: string) => {
    try {
      const form = formName === 'inbound' ? orderInForm : orderOutForm;
      const res = await generateBatchNumber();

      if (res.code === 200 && res.data) {
        // 获取批次号
        const newBatchNumber = res.data;

        // 直接设置字段值
        form.setFields([
          {
            name: ['orderItems', index, 'batchNumber'],
            value: newBatchNumber,
            // 确保验证状态更新
            touched: true,
            validating: false,
            errors: [],
          },
        ]);

        // 更新整个orderItems，确保表单知道值已更改
        const orderItems = form.getFieldValue('orderItems');
        if (orderItems && orderItems[index]) {
          orderItems[index].batchNumber = newBatchNumber;
          form.setFieldsValue({ orderItems });
        }

        // 将生成的批次号添加到选项中
        setBatchNumberOptions([newBatchNumber]);

        // 新生成的批次号不是已存在的批次号
        setExistingBatchNumbers((prev) => ({
          ...prev,
          [index]: false,
        }));

        // 手动验证当前字段，确保表单状态更新
        form
          .validateFields([['orderItems', index, 'batchNumber']])
          .catch(() => {
            // 忽略验证错误，因为我们知道值已设置
          });

        message.success('批次号生成成功');
      } else {
        message.error(res.msg || '批次号生成失败');
      }
    } catch (error) {
      console.error('生成批次号失败:', error);
      message.error('生成批次号失败');
    }
  };

  // 监听orderItems的变化，重新计算金额
  useEffect(() => {
    if (visible) {
      const orderItems = orderInForm.getFieldValue('orderItems');
      if (orderItems && orderItems.length > 0) {
        // 重新计算所有商品的金额
        calculateTotals('inbound');
      }
    }
  }, [orderInForm, visible]);

  // 检查批次号是否重复
  const checkDuplicateBatchNumber = (index: number, batchNumber: string, formName: string) => {
    if (!batchNumber) return false;
    
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const orderItems = form.getFieldValue('orderItems');
    
    // 获取当前产品ID或产品编码
    const currentItem = orderItems[index];
    const currentProductId = currentItem.isCustomProduct ? currentItem.productCode : currentItem.productId;
    
    if (!currentProductId) return false;
    
    // 检查其他相同产品是否已使用该批次号
    const duplicateIndex = orderItems.findIndex((item: any, idx: number) => {
      if (idx === index) return false; // 排除自身
      
      const itemProductId = item.isCustomProduct ? item.productCode : item.productId;
      return itemProductId === currentProductId && item.batchNumber === batchNumber;
    });
    
    // 如果找到重复，显示错误
    if (duplicateIndex !== -1) {
      setBatchNumberErrors(prev => ({
        ...prev,
        [index]: `批次号与第${duplicateIndex + 1}项商品重复，同一商品不能有相同批次号`
      }));
      return true;
    }
    
    // 清除错误
    setBatchNumberErrors(prev => ({
      ...prev,
      [index]: ''
    }));
    return false;
  };

  // 提交表单
  const handleSubmit = async (formName: string) => {
    try {
      const form = formName === 'inbound' ? orderInForm : orderOutForm;
      // 首先执行表单验证，这会触发所有必填字段的验证，包括批次号
      const values = await form.validateFields();

      // 检查所有自定义产品的编码是否有效
      const hasInvalidCode = values.orderItems.some(
        (item: any, index: number) => {
          if (item.isCustomProduct && !productCodeValid[index]) {
            return true;
          }
          return false;
        }
      );

      if (hasInvalidCode) {
        message.error('存在无效的产品编码，请修改后重试');
        return;
      }

      // 检查所有系统商品是否已选择产品
      const hasMissingProduct = values.orderItems.some((item: any) => {
        return !item.isCustomProduct && !item.productId;
      });

      if (hasMissingProduct) {
        message.error('存在未选择产品的系统商品，请选择产品后重试');
        return;
      }

      // 再次检查所有商品是否有批次号（双重保险）
      const hasMissingBatchNumber = values.orderItems.some((item: any) => {
        return !item.batchNumber || item.batchNumber.trim() === '';
      });

      if (hasMissingBatchNumber) {
        message.error('存在未设置批次号的商品，请完善后重试');
        return;
      }
      
      // 检查是否有重复的批次号
      let hasDuplicateBatchNumber = false;
      
      // 清空所有批次号错误，重新检查一遍
      setBatchNumberErrors({});
      
      // 创建一个Map来跟踪每个产品的批次号
      const productBatchMap = new Map<string, Set<string>>();
      
      values.orderItems.forEach((item: any, index: number) => {
        const productId = item.isCustomProduct ? item.productCode : item.productId;
        const batchNumber = item.batchNumber;
        
        if (!productId || !batchNumber) return;
        
        if (!productBatchMap.has(productId)) {
          productBatchMap.set(productId, new Set());
        }
        
        const batchSet = productBatchMap.get(productId);
        
        // 如果此批次号已经被同一产品使用，说明有重复
        if (batchSet?.has(batchNumber)) {
          setBatchNumberErrors(prev => ({
            ...prev,
            [index]: `此批次号已被相同商品使用，请修改`
          }));
          hasDuplicateBatchNumber = true;
        } else {
          batchSet?.add(batchNumber);
        }
      });
      
      if (hasDuplicateBatchNumber) {
        message.error('存在重复的批次号，同一商品不能使用相同批次号');
        return;
      }

      setLoading(true);

      // 处理入库订单
      if (formName === 'inbound') {
        // 准备订单数据
        const { totalAmount, totalQuantity } = calculateTotals('inbound');

        const orderIn: OrderIn = {
          id: '',
          orderNo: '', // 后端生成
          type: 1, // 入库订单
          orderType: values.orderType, // 订单类型：1-采购入库，2-自动入库
          creator: values.creatorId,
          approver: values.approverId || '',
          inspector: null,
          expectedTime: values.expectedTime
            ? values.expectedTime.format('YYYY-MM-DD HH:mm:ss')
            : (null as any),
          actualTime: null as any, // 实际到达时间为空
          totalAmount,
          totalQuantity,
          status: 0, // 状态：0-待审核
          qualityStatus: 0, // 质检状态：0-未质检
          remark: values.remark || '',
          createTime:
            new Date().toISOString().split('T')[0] +
            ' ' +
            new Date().toTimeString().split(' ')[0],
          updateTime:
            new Date().toISOString().split('T')[0] +
            ' ' +
            new Date().toTimeString().split(' ')[0],
        };

        // 准备订单明细数据，将系统商品的ID放入orderItems中
        const orderItems: OrderInItem[] = values.orderItems.map(
          (item: any, idx: number) => {
            // 对于系统商品，仍然确保已选择了产品
            if (!item.isCustomProduct && !item.productId) {
              message.error(`第${idx + 1}个系统商品没有选择产品！`);
              throw new Error('系统商品必须选择产品');
            }

            return {
              id: '',
              orderId: '',
              productId: !item.isCustomProduct ? item.productId : '', // 系统商品需要携带productId，自定义产品为空
              productName: item.productName || '',
              productCode: item.productCode || '',
              expectedQuantity: item.expectedQuantity || 0,
              actualQuantity: 0, // 实际数量为0
              price: item.price || 0,
              amount: item.amount || 0,
              areaId: '',
              location: [],
              batchNumber: item.batchNumber || '',
              productionDate: item.productionDate
                ? item.productionDate.format('YYYY-MM-DD')
                : (null as any),
              expiryDate: null as any, // 过期日期为空
              status: 0, // 状态：0-待开始
              qualityStatus: 0, // 质检状态：0-未质检
              remark: item.remark || '',
              createTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
              updateTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
            };
          }
        );

        // 创建JavaScript原生Map对象来存储产品数据
        const productIds = new Map<string, Product>();

        // 遍历所有产品，添加到Map中
        values.orderItems.forEach((item: any) => {
          // 确保productCode存在
          if (!item.productCode) {
            throw new Error('产品编码不能为空');
          }

          // 对于自定义产品，添加完整的产品信息
          if (item.isCustomProduct) {
            // 处理级联选择器的值，取最后一级
            let categoryId = '';
            if (item.categoryId && Array.isArray(item.categoryId)) {
              categoryId = item.categoryId[item.categoryId.length - 1];
            }

            // 将自定义产品信息添加到 productIds Map 中，使用productCode作为key
            productIds.set(item.productCode, {
              id: '', // 新产品 ID 为空
              productName: item.productName,
              productCode: item.productCode,
              brand: item.brand || '',
              model: item.model || '',
              spec: item.spec || '', // 规格
              categoryId: categoryId, // 使用处理后的分类ID
              price: item.price || 0,
              minStock: 0, // 最小库存
              maxStock: 999, // 最大库存
              imageUrl: '', // 图片URL
              description: item.remark || '',
              createTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
              updateTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
            });
          }
          // 对于系统产品，仅添加ID和编码
          else if (item.productId) {
            productIds.set(item.productCode, {
              id: item.productId,
              productCode: item.productCode,
              productName: item.productName || '',
              // 其他字段使用默认值或空值
              brand: '',
              model: '',
              spec: '',
              categoryId: '',
              price: item.price || 0,
              minStock: 0,
              maxStock: 0,
              imageUrl: '',
              description: '',
              createTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
              updateTime:
                new Date().toISOString().split('T')[0] +
                ' ' +
                new Date().toTimeString().split(' ')[0],
            });
          }
        });

        // 转换Map为JSON对象进行传输（因为Map不能直接序列化）
        const productIdsObject: Record<string, Product> = {};
        productIds.forEach((value, key) => {
          productIdsObject[key] = value;
        });

        // 提交订单，包含转换后的Map数据
        const orderDto = {
          order: orderIn,
          orderItems,
          products: productIdsObject,
        };

        const result = await insertOrderIn(orderDto as any);

        if (result.code === 200) {
          message.success('入库订单创建成功');
          // 先调用onSuccess刷新表格数据，再关闭抽屉
          onSuccess();
          handleClose(); // 使用handleClose关闭抽屉并清除数据
        } else {
          message.error(result.msg || '入库订单创建失败');
        }
      }
      // 处理出库订单 - 需要补充出库订单的接口和实现
      else {
        message.info('出库订单功能尚未实现');
      }
    } catch (error) {
      console.error('提交订单失败:', error);
      message.error('提交订单失败，请检查表单数据');
    } finally {
      setLoading(false);
    }
  };

  // 入库订单表单内容
  const renderInboundForm = () => {
    // 每次渲染前重新计算总金额和总数量
    const { totalAmount, totalQuantity } = calculateTotals('inbound');

    return (
      <Form form={orderInForm} layout='vertical' requiredMark={true}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='orderType'
              label='订单类型'
              rules={[{ required: true, message: '请选择订单类型' }]}
            >
              <Select placeholder='请选择订单类型'>
                <Option value={1}>采购入库</Option>
                <Option value={2}>退货入库</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='expectedTime'
              label='预计到达时间'
              rules={[{ required: true, message: '请选择预计到达时间' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                locale={locale}
                showTime
                format='YYYY-MM-DD HH:mm:ss'
                defaultValue={null}
                disabledDate={(current) => {
                  // 只禁用今天之前的日期，允许选择今天及未来日期
                  return (
                    current &&
                    current.startOf('day').valueOf() < Date.now() - 8.64e7
                  ); // 减去一天的毫秒数
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name='creatorId'
              label='创建人'
              rules={[{ required: true, message: '请输入创建人' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name='approverId'
              label='审批人'
              rules={[{ required: true, message: '请选择审批人' }]}
            >
              <Select
                showSearch
                placeholder='请输入审批人姓名'
                filterOption={false}
                onSearch={handleApproverSearch}
                allowClear
              >
                {approverOptions.map((user) => (
                  <Option key={user.userId} value={user.userId}>
                    {user.realName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name='remark' label='备注'>
          <TextArea rows={2} placeholder='请输入备注信息' />
        </Form.Item>

        <Divider orientation='left'>订单明细</Divider>

        <Form.List name='orderItems'>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{
                    marginBottom: 16,
                    border: '1px dashed #d9d9d9',
                    padding: 16,
                    borderRadius: 4,
                  }}
                >
                  <Row gutter={16} align='middle'>
                    <Col span={22}>
                      <Title level={5}>商品 #{index + 1}</Title>
                    </Col>
                    <Col span={2} style={{ textAlign: 'right' }}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ fontSize: 18, color: '#ff4d4f' }}
                        />
                      )}
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'isCustomProduct']}
                        label='商品来源'
                        initialValue={false}
                      >
                        <Select
                          onChange={(value) =>
                            handleCustomProductChange(
                              value as boolean,
                              index,
                              'inbound'
                            )
                          }
                        >
                          <Option value={false}>系统产品</Option>
                          <Option value={true}>自定义产品</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      {!orderInForm.getFieldValue([
                        'orderItems',
                        index,
                        'isCustomProduct',
                      ]) ? (
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          label='产品'
                          rules={[{ required: true, message: '请选择产品' }]}
                        >
                          <Select
                            showSearch
                            placeholder='请输入产品名称搜索'
                            filterOption={false}
                            onSearch={handleProductSearch}
                            onChange={(value) =>
                              handleProductSelect(
                                value as string,
                                index,
                                'inbound'
                              )
                            }
                            allowClear
                          >
                            {productOptions.map((product) => (
                              <Option key={product.id} value={product.id}>
                                {product.productName} ({product.productCode})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      ) : (
                        <Form.Item
                          {...restField}
                          name={[name, 'productName']}
                          label='产品名称'
                          rules={[
                            { required: true, message: '请输入产品名称' },
                          ]}
                        >
                          <Input placeholder='请输入产品名称' />
                        </Form.Item>
                      )}
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productCode']}
                        label='产品编码'
                        rules={[{ required: true, message: '请输入产品编码' }]}
                        validateStatus={
                          orderInForm.getFieldValue([
                            'orderItems',
                            index,
                            'isCustomProduct',
                          ]) && productCodeError[index] 
                            ? 'error' 
                            : undefined
                        }
                        help={
                          orderInForm.getFieldValue([
                            'orderItems',
                            index,
                            'isCustomProduct',
                          ]) 
                            ? productCodeError[index] 
                            : undefined
                        }
                        extra={
                          orderInForm.getFieldValue([
                            'orderItems',
                            index,
                            'isCustomProduct',
                          ])
                            ? '产品编码必须唯一，不能与系统中的产品编码或表单中其他自定义产品编码重复'
                            : undefined
                        }
                      >
                        <Input
                          placeholder='请输入产品编码'
                          disabled={
                            !orderInForm.getFieldValue([
                              'orderItems',
                              index,
                              'isCustomProduct',
                            ])
                          }
                          onChange={(e) => {
                            if (
                              orderInForm.getFieldValue([
                                'orderItems',
                                index,
                                'isCustomProduct',
                              ])
                            ) {
                              handleProductCodeCheck(e.target.value, index);
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'expectedQuantity']}
                        label='预期数量'
                        rules={[{ required: true, message: '请输入预期数量' }]}
                        initialValue={1}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: '100%' }}
                          placeholder='请输入预期数量'
                          onChange={() =>
                            handleQuantityOrPriceChange(index, 'inbound')
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label='单价'
                        rules={[{ required: true, message: '请输入单价' }]}
                      >
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          placeholder='请输入单价'
                          onChange={() =>
                            handleQuantityOrPriceChange(index, 'inbound')
                          }
                          disabled={
                            // 只有系统商品（非自定义商品且有选择产品）时才禁用单价编辑
                            !orderInForm.getFieldValue([
                              'orderItems',
                              index,
                              'isCustomProduct',
                            ]) &&
                            !!orderInForm.getFieldValue([
                              'orderItems',
                              index,
                              'productId',
                            ])
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 自定义产品额外字段 */}
                  {orderInForm.getFieldValue([
                    'orderItems',
                    index,
                    'isCustomProduct',
                  ]) && (
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'brand']}
                          label='品牌'
                          rules={[{ required: true, message: '请输入品牌' }]}
                        >
                          <Input placeholder='请输入品牌' />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'model']}
                          label='型号'
                          rules={[{ required: true, message: '请输入型号' }]}
                        >
                          <Input placeholder='请输入型号' />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'spec']}
                          label='规格'
                          rules={[{ required: true, message: '请输入规格' }]}
                        >
                          <Input placeholder='请输入规格' />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'categoryId']}
                          label='分类'
                          rules={[{ required: true, message: '请选择分类' }]}
                        >
                          <Cascader
                            options={categoryOptions}
                            placeholder='请选择产品分类'
                            changeOnSelect
                            expandTrigger='hover'
                            displayRender={displayRender}
                            showSearch={{
                              filter: (inputValue, path) => {
                                return path.some(
                                  (option) =>
                                    option.label
                                      .toLowerCase()
                                      .indexOf(inputValue.toLowerCase()) > -1
                                );
                              },
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'amount']}
                        label='金额'
                      >
                        <InputNumber
                          disabled
                          style={{ width: '100%' }}
                          formatter={(value) =>
                            `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'batchNumber']}
                        label='批次号'
                        rules={[{ required: true, message: '请输入批次号' }]}
                        extra={
                          <div>
                            <Text type='secondary'>请输入批次号 或 </Text>
                            <Button
                              type='link'
                              size='small'
                              icon={<ReloadOutlined />}
                              onClick={() =>
                                handleGenerateBatchNumber(index, 'inbound')
                              }
                              disabled={
                                !selectedProducts[index] &&
                                !orderInForm.getFieldValue([
                                  'orderItems',
                                  index,
                                  'isCustomProduct',
                                ])
                              }
                              style={{ padding: 0 }}
                            >
                              生成批次号
                            </Button>
                          </div>
                        }
                      >
                        <AutoComplete
                          placeholder='请输入批次号'
                          options={batchNumberOptions.map((batch) => ({
                            value: batch,
                          }))}
                          onSearch={(value) =>
                            handleBatchNumberSearch(value, index, 'inbound')
                          }
                          onChange={(value) => {
                            // 设置批次号的值到表单中，包括空值
                            const orderItems =
                              orderInForm.getFieldValue('orderItems');
                            orderItems[index].batchNumber = value || '';
                            orderInForm.setFieldsValue({ orderItems });

                            // 如果清空了输入，也要清空选项和错误
                            if (!value) {
                              setBatchNumberOptions([]);
                              // 重置已存在批次号状态
                              setExistingBatchNumbers((prev) => ({
                                ...prev,
                                [index]: false,
                              }));
                              // 清除批次号错误
                              setBatchNumberErrors(prev => ({
                                ...prev,
                                [index]: ''
                              }));
                            } else {
                              // 检查选择的批次号是否是从下拉选项中选择的已存在批次号
                              // 如果新值在批次号选项中(除了第一项可能是用户刚输入的)，且不是空值，则认为是选择了已存在的批次号
                              const isExistingBatch =
                                batchNumberOptions.length > 1 &&
                                batchNumberOptions
                                  .slice(1)
                                  .some((batch) => batch === value);

                              setExistingBatchNumbers((prev) => ({
                                ...prev,
                                [index]: isExistingBatch,
                              }));
                              
                              // 检查批次号是否重复
                              checkDuplicateBatchNumber(index, value, 'inbound');
                            }
                          }}
                          disabled={
                            !selectedProducts[index] &&
                            !orderInForm.getFieldValue([
                              'orderItems',
                              index,
                              'isCustomProduct',
                            ])
                          }
                          style={{ width: '100%' }}
                          allowClear
                          backfill
                          status={batchNumberErrors[index] ? 'error' : undefined}
                        />
                        {batchNumberErrors[index] && (
                          <div style={{ color: 'red', fontSize: '12px' }}>
                            {batchNumberErrors[index]}
                          </div>
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productionDate']}
                        label='生产日期'
                        rules={[
                          {
                            required: !existingBatchNumbers[index],
                            message: '请选择生产日期',
                          },
                        ]}
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          locale={locale}
                          format='YYYY-MM-DD'
                          defaultValue={null}
                          disabled={existingBatchNumbers[index]} // 如果是已存在的批次号，禁用生产日期编辑
                          disabledDate={(current) => {
                            // 禁用未来日期，只允许选择当前日期及以前的日期
                            return current && current.valueOf() > Date.now();
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    {...restField}
                    name={[name, 'remark']}
                    label='备注'
                  >
                    <Input placeholder='请输入备注' />
                  </Form.Item>
                </div>
              ))}

              <Form.Item>
                <Button
                  type='dashed'
                  onClick={() =>
                    add({
                      key: generateId(),
                      expectedQuantity: 1,
                      price: null,
                      amount: 0, // 初始金额会在添加后自动计算
                      isCustomProduct: false,
                      status: 0,
                      qualityStatus: 0,
                      productionDate: null, // 改为null，让组件自己处理默认日期
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  添加商品
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Text strong>总数量：{totalQuantity}</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Text strong>总金额：¥ {totalAmount.toFixed(2)}</Text>
          </Col>
        </Row>
      </Form>
    );
  };

  // 出库订单表单内容
  const renderOutboundForm = () => {
    return (
      <OutboundOrderForm
        form={orderOutForm}
        approverOptions={approverOptions}
        productOptions={productOptions}
        batchNumberOptions={batchNumberOptions}
        currentUserId={currentUserId}
        handleApproverSearch={handleApproverSearch}
        handleProductSearch={handleProductSearch}
        handleProductSelect={handleProductSelect}
        handleQuantityOrPriceChange={handleQuantityOrPriceChange}
        handleBatchNumberSearch={handleBatchNumberSearch}
        generateBatchNumber={handleGenerateBatchNumber}
        calculateTotals={calculateTotals}
        generateId={generateId}
        visible={visible && activeTab === 'outbound'}
      />
    );
  };

  // 修改Tab切换函数
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Drawer
      title='新增订单'
      width={720}
      onClose={handleClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type='primary'
              onClick={() => handleSubmit(activeTab)}
              loading={loading}
              icon={<SaveOutlined />}
            >
              提交
            </Button>
          </Space>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'inbound',
            label: '入库订单',
            children: renderInboundForm(),
          },
          {
            key: 'outbound',
            label: '出库订单',
            children: renderOutboundForm(),
          },
        ]}
      />
    </Drawer>
  );
};

export default OrderDrawer;
