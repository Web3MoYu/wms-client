import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Cascader,
  Space,
  message,
  Tooltip,
  Typography,
  Modal,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  pageProducts,
  ProductVo,
  Product,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../../../api/product-service/ProductController';
import {
  getProductCatTree,
  ProductCatTree,
} from '../../../api/product-service/ProductCatController';
import ProductForm from './ProductForm';

const { Title } = Typography;

// 查询条件类型定义
interface QueryParams {
  productName: string;
  categoryId: string;
  brand: string;
  page: number;
  pageSize: number;
}

// 级联选择器数据类型
interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  isLeaf?: boolean;
}

// 分类路径追踪（用于显示全路径名称）
interface CategoryPathMap {
  [key: string]: string; // id -> 全路径名称
}

export default function ProductManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    productName: '',
    categoryId: '',
    brand: '',
    page: 1,
    pageSize: 10,
  });
  const [categoryOptions, setCategoryOptions] = useState<CascaderOption[]>([]);
  const [categoryPathMap, setCategoryPathMap] = useState<CategoryPathMap>({});
  const [form] = Form.useForm();

  // 表单模态框状态
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

  // 初始化
  useEffect(() => {
    fetchProducts();
    fetchCategoryTree();
  }, []);

  // 加载产品数据
  const fetchProducts = async (params: QueryParams = queryParams) => {
    try {
      setLoading(true);
      const result = await pageProducts(
        params.page,
        params.pageSize,
        params.productName,
        params.categoryId,
        params.brand
      );

      if (result.code === 200 && result.data) {
        setProducts(result.data.records || []);
        setTotal(result.data.total || 0);
      } else {
        message.error(result.msg || '获取产品列表失败');
      }
    } catch (error) {
      console.error('获取产品列表出错:', error);
      message.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分类树
  const fetchCategoryTree = async () => {
    try {
      const result = await getProductCatTree();
      if (result.code === 200 && result.data) {
        // 构建分类路径映射和级联选项
        const pathMap: CategoryPathMap = {};
        const options = transformTreeData(result.data, pathMap);
        setCategoryOptions(options);
        setCategoryPathMap(pathMap);
      } else {
        message.error(result.msg || '获取分类树失败');
      }
    } catch (error) {
      console.error('获取分类树出错:', error);
      message.error('获取分类树失败');
    }
  };

  // 转换分类树数据为Cascader所需格式，同时构建路径映射
  const transformTreeData = (
    data: ProductCatTree[],
    pathMap: CategoryPathMap,
    parentPath: string = ''
  ): CascaderOption[] => {
    return data.map((item) => {
      // 当前分类名称
      const categoryName = item.category.categoryName;

      // 计算当前分类的完整路径
      const currentPath = parentPath
        ? `${parentPath}-${categoryName}`
        : categoryName;

      // 保存路径映射
      pathMap[item.category.id] = currentPath;

      // 构建级联选项
      return {
        value: item.category.id,
        label: categoryName,
        isLeaf: !item.children || item.children.length === 0,
        children:
          item.children && item.children.length > 0
            ? transformTreeData(item.children, pathMap, currentPath)
            : undefined,
      };
    });
  };

  // 处理查询表单提交
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newParams = {
      ...queryParams,
      page: 1, // 重置到第一页
      productName: values.productName || '',
      categoryId: values.categoryId?.[values.categoryId.length - 1] || '', // 获取级联选择的最后一项
      brand: values.brand || '',
    };
    setQueryParams(newParams);
    fetchProducts(newParams);
  };

  // 处理重置查询
  const handleReset = () => {
    form.resetFields();
    const newParams = {
      productName: '',
      categoryId: '',
      brand: '',
      page: 1,
      pageSize: queryParams.pageSize,
    };
    setQueryParams(newParams);
    fetchProducts(newParams);
  };

  // 处理分页变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    const newParams = {
      ...queryParams,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
    };
    setQueryParams(newParams);
    fetchProducts(newParams);
  };

  // 打开添加产品模态框
  const handleAddProduct = () => {
    setIsEdit(false);
    setCurrentProduct({});
    setModalVisible(true);
  };

  // 打开编辑产品模态框
  const handleEditProduct = (record: ProductVo) => {
    setIsEdit(true);
    // 创建一个包含已有数据的产品对象
    const productData = { ...record };

    // 如果存在分类ID和分类名称映射，确保使用正确的分类ID
    if (productData.categoryId && categoryPathMap[productData.categoryId]) {
      // categoryId 已经是正确的，不需要修改
      console.log('使用分类ID:', productData.categoryId);
    }

    setCurrentProduct(productData);
    setModalVisible(true);
  };

  // 处理删除产品
  const handleDeleteProduct = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteProduct(id);
      if (result.code === 200 && result.msg) {
        message.success(result.msg);
        fetchProducts();
      } else {
        message.error(result.msg || '删除产品失败');
      }
    } catch (error) {
      console.error('删除产品出错:', error);
      message.error('删除产品失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交（新增或编辑）
  const handleFormSubmit = async (values: any) => {
    try {
      setSubmitLoading(true);

      // 处理价格，转为字符串
      if (typeof values.price === 'number') {
        values.price = values.price.toString();
      }

      let result;
      if (isEdit) {
        // 编辑模式
        result = await updateProduct(currentProduct.id as string, values);
      } else {
        // 新增模式
        result = await addProduct(values);
      }
      if (result.code === 200 && result.msg) {
        message.success(isEdit ? '更新产品成功' : '添加产品成功');
        setModalVisible(false);
        fetchProducts();
      } else {
        message.error(result.msg || (isEdit ? '更新产品失败' : '添加产品失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新产品出错:' : '添加产品出错:', error);
      message.error(isEdit ? '更新产品失败' : '添加产品失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 自定义级联选择器显示
  const displayRender = (labels: string[]) => {
    return labels.join('-');
  };

  // 表格列定义
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 120,
      render: (categoryId: string) => {
        // 处理空值情况
        if (!categoryId) return '-';
        // 使用分类路径映射显示完整路径
        const displayName = categoryPathMap[categoryId];
        return displayName || categoryId;
      },
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 120,
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      render: (text: string) => {
        if (!text) return '-';
        const displayText =
          text.length > 10 ? `${text.substring(0, 10)}...` : text;
        return <Tooltip title={text}>{displayText}</Tooltip>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ProductVo) => (
        <Space size='small'>
          <Button
            type='link'
            size='small'
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title='确定要删除这个产品吗?'
            onConfirm={() => handleDeleteProduct(record.id)}
            okText='确定'
            cancelText='取消'
          >
            <Button type='link' size='small' danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title={<Title level={4}>产品管理</Title>}>
      {/* 查询表单 */}
      <Form form={form} layout='inline' style={{ marginBottom: '20px' }}>
        <Form.Item name='productName' label='产品名称'>
          <Input placeholder='请输入产品名称' allowClear />
        </Form.Item>
        <Form.Item name='categoryId' label='产品分类'>
          <Cascader
            options={categoryOptions}
            placeholder='请选择产品分类'
            style={{ width: 250 }}
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
            allowClear
          />
        </Form.Item>
        <Form.Item name='brand' label='品牌'>
          <Input placeholder='请输入品牌' allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type='primary'
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
          >
            新增产品
          </Button>
        </Space>
      </div>

      {/* 产品表格 */}
      <Table
        rowKey='id'
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={{
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      {/* 产品表单模态框 */}
      <Modal
        title={isEdit ? '编辑产品' : '添加产品'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ProductForm
          initialValues={currentProduct}
          onFinish={handleFormSubmit}
          onCancel={handleCancel}
          categoryOptions={categoryOptions}
          loading={submitLoading}
          isEdit={isEdit}
        />
      </Modal>
    </Card>
  );
}
