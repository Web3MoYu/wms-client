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
  ReloadOutlined
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
  generateBatchNumber
} from '../../../api/product-service/ProductController';
import { getProductCatTree, ProductCatTree } from '../../../api/product-service/ProductCatController';
import { getBatchNumber } from '../../../api/stock-service/StockController';
import { getUsersByName, User } from '../../../api/sys-service/UserController';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
  const [inspectorOptions, setInspectorOptions] = useState<User[]>([]);
  
  // 产品搜索相关状态
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  
  // 批次号搜索相关状态
  const [batchNumberOptions, setBatchNumberOptions] = useState<string[]>([]);
  
  // 新增自定义产品编码校验状态
  const [productCodeValidating, setProductCodeValidating] = useState<Record<string, boolean>>({});
  const [productCodeValid, setProductCodeValid] = useState<Record<string, boolean>>({});
  const [productCodeError, setProductCodeError] = useState<Record<string, string>>({});
  
  // 添加分类树状态
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  
  // 添加产品选择状态跟踪
  const [selectedProducts, setSelectedProducts] = useState<Record<number, boolean>>({});
  
  // 清空表单
  useEffect(() => {
    if (visible) {
      orderInForm.resetFields();
      orderOutForm.resetFields();
      
      // 设置默认值
      const defaultOrderItems = [{ 
        key: generateId(),
        productId: '',
        productName: '',
        productCode: '',
        expectedQuantity: 1,
        price: 0,
        amount: 0,
        isCustomProduct: false,
        batchNumber: '',
        productionDate: null, // 改为null，让组件自己处理默认日期
        status: 0, // 待开始
        qualityStatus: 0, // 未质检
      }];
      
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
          return items.map(item => ({
            value: item.category.id,
            label: item.category.categoryName,
            children: item.children && item.children.length > 0 
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
  
  // 防抖搜索质检员
  const handleInspectorSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setInspectorOptions([]);
      return;
    }
    
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setInspectorOptions(res.data);
      }
    } catch (error) {
      console.error('搜索质检员失败:', error);
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
  const handleBatchNumberSearch = debounce(async (batchNumber: string, index: number, formName: string) => {
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
    const productCode = form.getFieldValue(['orderItems', index, 'productCode']);
    
    if (!productCode) {
      message.warning('产品编码获取失败，请重新选择产品');
      setBatchNumberOptions([]);
      return;
    }
    
    try {
      const res = await getBatchNumber(productCode, batchNumber);
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
  }, 500);
  
  // 处理产品选择
  const handleProductSelect = (productId: string, index: number, formName: string) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const selectedProduct = productOptions.find(p => p.id === productId);
    
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
      orderItems[index].amount = (orderItems[index].expectedQuantity || 0) * (orderItems[index].price || 0);
      
      form.setFieldsValue({
        orderItems,
      });
      
      // 更新产品选择状态
      setSelectedProducts(prev => ({
        ...prev,
        [index]: true
      }));
      
      // 重新计算总金额
      calculateTotals(formName);
      
      // 清空批次号选项
      setBatchNumberOptions([]);
    }
  };
  
  // 处理自定义产品切换
  const handleCustomProductChange = (isCustom: boolean, index: number, formName: string) => {
    const form = formName === 'inbound' ? orderInForm : orderOutForm;
    const orderItems = form.getFieldValue('orderItems');
    
    if (isCustom) {
      // 切换为自定义产品
      orderItems[index] = {
        ...orderItems[index],
        productId: '', // 清空产品ID
        isCustomProduct: true,
        batchNumber: '', // 清空批次号
      };
      
      // 更新产品选择状态 - 自定义产品也设置为已选择，这样可以输入批次号
      setSelectedProducts(prev => ({
        ...prev,
        [index]: true
      }));
    } else {
      // 切换为系统产品
      orderItems[index] = {
        ...orderItems[index],
        isCustomProduct: false,
        productId: '', // 确保清空产品ID
        productName: '', // 清空产品名称
        productCode: '', // 清空产品编码
        batchNumber: '', // 清空批次号
      };
      
      // 更新产品选择状态 - 系统产品需要选择后才能输入批次号
      setSelectedProducts(prev => ({
        ...prev,
        [index]: false
      }));
    }
    
    form.setFieldsValue({
      orderItems,
    });
    
    // 清空批次号选项
    setBatchNumberOptions([]);
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
  const handleProductCodeCheck = debounce(async (productCode: string, index: number) => {
    if (!productCode || productCode.length < 1) {
      return;
    }
    
    // 只有自定义产品才需要验证编码
    const isCustomProduct = orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct']);
    if (!isCustomProduct) {
      return;
    }
    
    try {
      setProductCodeValidating({ ...productCodeValidating, [index]: true });
      
      // 先检查表单内部是否有重复的产品编码
      const orderItems = orderInForm.getFieldValue('orderItems') || [];
      const duplicateIndex = orderItems.findIndex((item: any, i: number) => 
        i !== index && 
        item.isCustomProduct && 
        item.productCode === productCode
      );
      
      if (duplicateIndex !== -1) {
        setProductCodeValid({ ...productCodeValid, [index]: false });
        setProductCodeError({ ...productCodeError, [index]: '表单中已存在相同产品编码，请更换' });
        setProductCodeValidating({ ...productCodeValidating, [index]: false });
        return;
      }
      
      // 再检查系统中是否已存在该产品编码
      const res = await checkProductCode(productCode);
      
      if (res.code === 200) {
        // 如果返回 true，表示编码已存在
        const exists = res.data;
        
        if (exists) {
          setProductCodeValid({ ...productCodeValid, [index]: false });
          setProductCodeError({ ...productCodeError, [index]: '产品编码已存在，请更换' });
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
  }, 500);
  
  // 生成批次号
  const handleGenerateBatchNumber = async (index: number, formName: string) => {
    try {
      const form = formName === 'inbound' ? orderInForm : orderOutForm;
      const res = await generateBatchNumber();
      
      if (res.code === 200 && res.data) {
        // 获取批次号
        const newBatchNumber = res.data;
        
        // 直接设置字段值
        form.setFields([{
          name: ['orderItems', index, 'batchNumber'],
          value: newBatchNumber
        }]);
        
        // 将生成的批次号添加到选项中
        setBatchNumberOptions([newBatchNumber]);
        
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
  
  // 提交表单
  const handleSubmit = async (formName: string) => {
    try {
      const form = formName === 'inbound' ? orderInForm : orderOutForm;
      const values = await form.validateFields();
      
      // 检查所有自定义产品的编码是否有效
      const hasInvalidCode = values.orderItems.some((item: any, index: number) => {
        if (item.isCustomProduct && !productCodeValid[index]) {
          return true;
        }
        return false;
      });
      
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
      
      // 检查所有商品是否有批次号
      const hasMissingBatchNumber = values.orderItems.some((item: any) => {
        return !item.batchNumber;
      });
      
      if (hasMissingBatchNumber) {
        message.error('存在未设置批次号的商品，请完善后重试');
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
          inspector: values.inspectorId || '',
          expectedTime: values.expectedTime ? values.expectedTime.format('YYYY-MM-DD HH:mm:ss') : null as any,
          actualTime: null as any, // 实际到达时间为空
          totalAmount,
          totalQuantity,
          status: 0, // 状态：0-待审核
          qualityStatus: 0, // 质检状态：0-未质检
          remark: values.remark || '',
          createTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
          updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        };
        
        // 准备订单明细数据，将系统商品的ID放入orderItems中
        const orderItems: OrderInItem[] = values.orderItems.map((item: any, idx: number) => {
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
            productionDate: item.productionDate ? item.productionDate.format('YYYY-MM-DD') : null as any,
            expiryDate: null as any, // 过期日期为空
            status: 0, // 状态：0-待开始
            qualityStatus: 0, // 质检状态：0-未质检
            remark: item.remark || '',
            createTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
            updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
          };
        });
        
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
              createTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
              updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
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
              createTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
              updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
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
          products: productIdsObject
        };
        
        
        const result = await insertOrderIn(orderDto as any);
        
        if (result.code === 200) {
          message.success('入库订单创建成功');
          // 先调用onSuccess刷新表格数据，再关闭抽屉
          onSuccess();
          onClose();
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
      <Form
        form={orderInForm}
        layout="vertical"
        requiredMark={true}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="orderType"
              label="订单类型"
              rules={[{ required: true, message: '请选择订单类型' }]}
            >
              <Select placeholder="请选择订单类型">
                <Option value={1}>采购入库</Option>
                <Option value={2}>退货入库</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expectedTime"
              label="预计到达时间"
              rules={[{ required: true, message: '请选择预计到达时间' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                locale={locale}
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                defaultValue={null}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="creatorId"
              label="创建人"
              rules={[{ required: true, message: '请输入创建人' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="approverId"
              label="审批人"
              rules={[{ required: true, message: '请选择审批人' }]}
            >
              <Select
                showSearch
                placeholder="请输入审批人姓名"
                filterOption={false}
                onSearch={handleApproverSearch}
                allowClear
              >
                {approverOptions.map(user => (
                  <Option key={user.userId} value={user.userId}>
                    {user.realName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="inspectorId"
              label="质检员"
              rules={[{ required: true, message: '请选择质检员' }]}
            >
              <Select
                showSearch
                placeholder="请输入质检员姓名"
                filterOption={false}
                onSearch={handleInspectorSearch}
                allowClear
              >
                {inspectorOptions.map(user => (
                  <Option key={user.userId} value={user.userId}>
                    {user.realName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea rows={2} placeholder="请输入备注信息" />
        </Form.Item>
        
        <Divider orientation="left">订单明细</Divider>
        
        <Form.List name="orderItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} style={{ marginBottom: 16, border: '1px dashed #d9d9d9', padding: 16, borderRadius: 4 }}>
                  <Row gutter={16} align="middle">
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
                        label="商品来源"
                        initialValue={false}
                      >
                        <Select 
                          onChange={(value) => handleCustomProductChange(value as boolean, index, 'inbound')}
                        >
                          <Option value={false}>系统产品</Option>
                          <Option value={true}>自定义产品</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      {!orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct']) ? (
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          label="产品"
                          rules={[{ required: true, message: '请选择产品' }]}
                        >
                          <Select
                            showSearch
                            placeholder="请输入产品名称搜索"
                            filterOption={false}
                            onSearch={handleProductSearch}
                            onChange={(value) => handleProductSelect(value as string, index, 'inbound')}
                            allowClear
                          >
                            {productOptions.map(product => (
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
                          label="产品名称"
                          rules={[{ required: true, message: '请输入产品名称' }]}
                        >
                          <Input placeholder="请输入产品名称" />
                        </Form.Item>
                      )}
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productCode']}
                        label="产品编码"
                        rules={[{ required: true, message: '请输入产品编码' }]}
                        validateStatus={productCodeError[index] ? 'error' : undefined}
                        help={productCodeError[index] || undefined}
                        extra={orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct']) ? 
                          "产品编码必须唯一，不能与系统中的产品编码或表单中其他自定义产品编码重复" : undefined}
                      >
                        <Input 
                          placeholder="请输入产品编码" 
                          disabled={!orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct'])}
                          onChange={(e) => {
                            if (orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct'])) {
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
                        label="预期数量"
                        rules={[{ required: true, message: '请输入预期数量' }]}
                        initialValue={1}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: '100%' }}
                          placeholder="请输入预期数量"
                          onChange={() => handleQuantityOrPriceChange(index, 'inbound')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label="单价"
                        rules={[{ required: true, message: '请输入单价' }]}
                        initialValue={0}
                      >
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          placeholder="请输入单价"
                          onChange={() => handleQuantityOrPriceChange(index, 'inbound')}
                          disabled={!orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct']) && 
                                  !!orderInForm.getFieldValue(['orderItems', index, 'productId'])}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  {/* 自定义产品额外字段 */}
                  {orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct']) && (
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'brand']}
                          label="品牌"
                          rules={[{ required: true, message: '请输入品牌' }]}
                        >
                          <Input placeholder="请输入品牌" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'model']}
                          label="型号"
                          rules={[{ required: true, message: '请输入型号' }]}
                        >
                          <Input placeholder="请输入型号" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'spec']}
                          label="规格"
                          rules={[{ required: true, message: '请输入规格' }]}
                        >
                          <Input placeholder="请输入规格" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'categoryId']}
                          label="分类"
                          rules={[{ required: true, message: '请选择分类' }]}
                        >
                          <Cascader
                            options={categoryOptions}
                            placeholder="请选择产品分类"
                            changeOnSelect
                            expandTrigger="hover"
                            displayRender={displayRender}
                            showSearch={{
                              filter: (inputValue, path) => {
                                return path.some(option => 
                                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                                );
                              }
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
                        label="金额"
                      >
                        <InputNumber
                          disabled
                          style={{ width: '100%' }}
                          formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'batchNumber']}
                        label="批次号"
                        rules={[{ required: true, message: '请输入批次号' }]}
                        extra={
                          <div>
                            <Text type="secondary">请输入批次号 或 </Text>
                            <Button 
                              type="link" 
                              size="small" 
                              icon={<ReloadOutlined />}
                              onClick={() => handleGenerateBatchNumber(index, 'inbound')}
                              disabled={!selectedProducts[index] && !orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct'])}
                              style={{ padding: 0 }}
                            >
                              生成批次号
                            </Button>
                          </div>
                        }
                      >
                        <AutoComplete
                          placeholder="请输入批次号"
                          options={batchNumberOptions.map((batch) => ({ value: batch }))}
                          onSearch={(value) => handleBatchNumberSearch(value, index, 'inbound')}
                          onChange={(value) => {
                            if (value) {
                              // 设置批次号的值到表单中
                              const orderItems = orderInForm.getFieldValue('orderItems');
                              orderItems[index].batchNumber = value;
                              orderInForm.setFieldsValue({ orderItems });
                            }
                          }}
                          disabled={!selectedProducts[index] && !orderInForm.getFieldValue(['orderItems', index, 'isCustomProduct'])}
                          style={{ width: '100%' }}
                          allowClear
                          backfill
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productionDate']}
                        label="生产日期"
                        rules={[{ required: true, message: '请选择生产日期' }]}
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          locale={locale}
                          format="YYYY-MM-DD"
                          defaultValue={null}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'remark']}
                    label="备注"
                  >
                    <Input placeholder="请输入备注" />
                  </Form.Item>
                </div>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ 
                    key: generateId(),
                    expectedQuantity: 1,
                    price: 0,
                    amount: 0, // 初始金额会在添加后自动计算
                    isCustomProduct: false,
                    status: 0,
                    qualityStatus: 0,
                    productionDate: null, // 改为null，让组件自己处理默认日期
                  })}
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
      <div>
        <Text>出库订单表单 - 待实现</Text>
      </div>
    );
  };
  
  return (
    <Drawer
      title="新增订单"
      width={720}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button 
              type="primary" 
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
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <TabPane tab="入库订单" key="inbound">
          {renderInboundForm()}
        </TabPane>
        <TabPane tab="出库订单" key="outbound">
          {renderOutboundForm()}
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default OrderDrawer; 