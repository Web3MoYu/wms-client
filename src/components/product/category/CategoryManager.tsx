import { useEffect, useState, useRef } from 'react';
import {
  Card,
  Spin,
  message,
  Typography,
  Empty,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
} from 'antd';
import {
  getProductCatTree,
  ProductCatTree,
  ProductCat,
  addProductCat,
  updateProductCat,
  deleteProductCat,
  checkCategoryCode,
} from '../../../api/product-service/ProductCatController';
import { Result } from '../../../api/Model';
import * as echarts from 'echarts';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

// 定义颜色主题
const THEME_COLORS = {
  primary: '#1890ff', // 蓝色主色调，参考Ant Design
  secondary: '#52c41a', // 绿色辅助色
  accent: '#f5222d', // 红色强调色
  text: '#262626', // 深色文本
  lightText: '#8c8c8c', // 浅色文本
  background: 'rgba(255, 255, 255, 0.9)', // 背景色
  nodeBackground: 'rgba(24, 144, 255, 0.1)', // 节点背景色
  hoverBackground: 'rgba(245, 34, 45, 0.1)', // 悬停背景色
};

// 添加操作类型定义
type OperationType = 'add' | 'edit' | 'delete';

// 添加图表数据节点类型
interface ChartNode {
  name: string;
  value: string;
  category: ProductCat;
  itemStyle?: any;
  lineStyle?: any;
  children?: ChartNode[];
}

export default function CategoryManager() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(
    null
  );
  // 添加分类树数据状态
  const [categoryTree, setCategoryTree] = useState<ProductCatTree[]>([]);

  // 弹窗和操作状态
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [operationType, setOperationType] = useState<OperationType>('add');
  const [currentNode, setCurrentNode] = useState<ProductCat | null>(null);
  const [parentNode, setParentNode] = useState<ProductCat | null>(null);
  const [form] = Form.useForm();

  // 悬浮节点状态
  const [hoverNodePosition, setHoverNodePosition] = useState({ x: 0, y: 0 });
  const [hoverActionVisible, setHoverActionVisible] = useState<boolean>(false);

  // 将API返回的树形数据转换为ECharts树图所需格式
  const transformToEChartsFormat = (data: ProductCatTree[]): any => {
    if (data.length === 0) return null;

    // 创建虚拟根节点，将所有顶级节点作为其子节点
    return {
      name: '产品分类',
      value: 'root',
      itemStyle: {
        borderColor: THEME_COLORS.accent,
        borderWidth: 2,
        color: 'rgba(245, 34, 45, 0.1)', // 使用accent颜色的浅色背景
      },
      tooltip: {
        show: false, // 禁用根节点的提示
      },
      children: data.map((node) => formatNode(node)),
    };
  };

  // 递归格式化节点
  const formatNode = (node: ProductCatTree): any => {
    const { category, children } = node;
    return {
      name: `${category.categoryName}\n(${category.categoryCode})`,
      value: category.id,
      category: category, // 保存原始类别数据，便于操作
      itemStyle: {
        borderColor: THEME_COLORS.primary,
        borderWidth: 2,
        color: THEME_COLORS.nodeBackground, // 使用新定义的节点背景色
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
      },
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          borderColor: THEME_COLORS.accent,
          shadowBlur: 5,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          color: THEME_COLORS.hoverBackground, // 使用新定义的悬停背景色
        },
      },
      lineStyle: {
        color: THEME_COLORS.primary, // 使用主色调作为连线颜色
        width: 1.5,
        curveness: 0.5, // 添加一定程度的曲线
      },
      // 递归处理子节点
      children: children?.map((child) => formatNode(child)) || [],
    };
  };

  // 将树图的点击事件改为鼠标悬停事件
  const setupChartEvents = (chart: echarts.ECharts) => {
    // 移除之前可能存在的事件监听
    chart.off('click');
    chart.off('mouseover');
    chart.off('mouseout');

    // 节点点击事件 - 处理折叠/展开
    chart.on('click', function () {
      // 点击节点时，隐藏悬浮操作按钮
      setHoverActionVisible(false);
    });

    // 鼠标悬停事件 - 显示操作按钮
    chart.on('mouseover', function (params: any) {
      // 忽略根节点
      if (params.value === 'root' || !params.event) return;

      // 确保数据有效且有category字段
      if (
        !params.data ||
        typeof params.data !== 'object' ||
        !params.data.category
      ) {
        console.error('节点数据格式不正确:', params.data);
        return;
      }

      // 获取节点数据
      const nodeData = params.data as ChartNode;
      setCurrentNode(nodeData.category);

      // 计算悬浮按钮的位置
      const chartDom = chartRef.current;
      if (chartDom) {
        setHoverNodePosition({
          x: params.event.offsetX,
          y: params.event.offsetY,
        });
        setHoverActionVisible(true);
      }
    });

    // 鼠标移出事件 - 隐藏操作按钮
    chart.on('mouseout', function () {
      // 设置一个短暂的延迟，以便用户有时间移动到操作按钮上
      // 如果用户移动到了操作按钮上，悬浮按钮组件的onMouseEnter会保持按钮可见
      setTimeout(() => {
        const actionButtons = document.querySelector('.hover-action-buttons');
        const hovering = actionButtons && actionButtons.matches(':hover');

        // 如果鼠标不在操作按钮上，则隐藏按钮
        if (!hovering) {
          setHoverActionVisible(false);
        }
      }, 50);
    });
  };

  // 初始化图表
  const initChart = (data: any) => {
    if (!chartRef.current) {
      console.warn('图表容器不存在，无法初始化图表');
      return;
    }

    try {
      // 销毁旧的实例
      if (chartInstance) {
        try {
          chartInstance.dispose();
        } catch (e) {
          console.error('销毁旧图表实例出错:', e);
        }
      }

      // 确保DOM元素存在且可操作
      if (!chartRef.current) {
        console.warn('图表容器在清理后不存在，取消初始化');
        return;
      }

      // 创建新实例
      const chart = echarts.init(chartRef.current);
      
      // 先存储实例，再设置配置，避免中间状态
      setChartInstance(chart);

      chart.setOption({
        backgroundColor: '#ffffff',
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#eee',
          borderWidth: 1,
          textStyle: {
            color: THEME_COLORS.text,
          },
          padding: [10, 15],
          formatter: function (params: any) {
            // 如果是虚拟根节点则隐藏tooltip
            if (params.value === 'root') return '';
            const parts = params.name.split('\n');
            return `
              <div style="font-weight:bold;margin-bottom:5px;">${parts[0]}</div>
              <div style="font-size:12px;color:${THEME_COLORS.lightText}">${parts[1]}</div>
              <div style="font-size:12px;margin-top:5px;">ID: ${params.value}</div>
            `;
          },
        },
        series: [
          {
            type: 'tree',
            data: [data],
            left: '5%',
            right: '15%',
            top: '5%',
            bottom: '5%',
            symbol: 'emptyCircle',
            symbolSize: function (value: any, params: any) {
              // 虚拟根节点使用较大的圆圈
              return params.data.value === 'root' ? 20 : 14;
            },
            itemStyle: {
              borderWidth: 2,
            },
            orient: 'LR', // 从左到右布局
            expandAndCollapse: true, // 启用点击节点时的折叠/展开功能
            initialTreeDepth: -1, // 默认展开所有节点
            roam: true, // 启用缩放和平移
            scaleLimit: {
              // 缩放限制
              min: 0.4,
              max: 2,
            },
            edgeShape: 'curve', // 使用曲线而不是折线
            edgeForkPosition: '63%', // 调整分叉位置以适应曲线
            nodePadding: 25, // 增加节点间的间距
            nodeAlign: 'left', // 节点对齐方式
            lineStyle: {
              color: THEME_COLORS.primary,
              width: 1.5,
              curveness: 0.5, // 曲线程度
            },
            label: {
              position: 'right',
              fontSize: 14,
              align: 'left',
              verticalAlign: 'middle',
              distance: 8,
              backgroundColor: THEME_COLORS.background,
              padding: [6, 10],
              borderRadius: 4,
              formatter: function (params: any) {
                // 虚拟根节点不显示标签
                if (params.value === 'root') return '';
                const parts = params.name.split('\n');
                return `{bold|${parts[0]}}\n{code|${parts[1]}}`;
              },
              rich: {
                bold: {
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: THEME_COLORS.text,
                },
                code: {
                  fontSize: 12,
                  color: THEME_COLORS.lightText,
                },
              },
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left',
              },
            },
            animationDuration: 550,
            animationDurationUpdate: 750,
          },
        ],
      });

      // 设置防止默认行为的配置
      chart.setOption(
        {
          series: [
            {
              type: 'tree',
              // 启用展开/折叠功能
              expandAndCollapse: true,
            },
          ],
        },
        false
      ); // 追加配置，不合并

      // 设置图表事件
      setupChartEvents(chart);

      // 响应容器大小变化
      const resizeHandler = () => {
        chart?.resize();
      };

      window.addEventListener('resize', resizeHandler);

      // 返回清理函数
      return () => {
        window.removeEventListener('resize', resizeHandler);
      };
    } catch (error) {
      console.error('初始化图表出错:', error);
    }
  };

  // 获取分类树数据
  const fetchCategoryTree = async () => {
    try {
      setLoading(true);
      const res: Result<ProductCatTree[]> = await getProductCatTree();
      if (res.code === 200) {
        // 让状态更新有序进行，避免DOM节点操作冲突
        // 先清理图表实例
        if (chartInstance) {
          try {
            chartInstance.dispose();
          } catch (e) {
            console.error('图表实例销毁出错:', e);
          }
          setChartInstance(null);
        }
        
        // 再更新分类树数据
        setCategoryTree(res.data || []);
        
        // 最后，如果有数据，再初始化图表
        if (res.data && res.data.length > 0) {
          const formattedData = transformToEChartsFormat(res.data);
          if (formattedData) {
            // 使用setTimeout确保DOM更新后再初始化图表
            setTimeout(() => {
              initChart(formattedData);
            }, 0);
          } else {
            message.error('数据格式转换失败');
          }
        }
      } else {
        message.error(res.msg || '获取分类树失败');
      }
    } catch (error) {
      console.error('获取分类树出错:', error);
      message.error('获取分类树失败');
    } finally {
      setLoading(false);
    }
  };

  // 放大图表
  const handleZoomIn = () => {
    if (chartInstance) {
      const option = chartInstance.getOption();
      const series = option.series as any[];
      chartInstance.setOption({
        series: [
          {
            ...series[0],
            zoom: (series[0].zoom || 1) * 1.2,
          },
        ],
      });
    }
  };

  // 缩小图表
  const handleZoomOut = () => {
    if (chartInstance) {
      const option = chartInstance.getOption();
      const series = option.series as any[];
      chartInstance.setOption({
        series: [
          {
            ...series[0],
            zoom: (series[0].zoom || 1) / 1.2,
          },
        ],
      });
    }
  };

  // 重置图表视图
  const handleReset = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: 'restore',
      });
    }
  };

  // 处理添加子分类
  const handleAddSubCategory = () => {
    console.log('添加子分类被点击，父节点:', currentNode);
    setOperationType('add');
    setParentNode(currentNode);
    setCurrentNode(null);
    setHoverActionVisible(false);

    // 重置表单
    form.resetFields();
    // 设置父分类字段
    form.setFieldsValue({
      parentId: currentNode?.id,
      parentName: currentNode?.categoryName,
    });

    setModalVisible(true);
  };

  // 处理编辑分类
  const handleEditCategory = () => {
    console.log('编辑分类被点击:', currentNode);
    setOperationType('edit');
    setHoverActionVisible(false);

    // 填充表单数据
    form.setFieldsValue({
      categoryName: currentNode?.categoryName,
      categoryCode: currentNode?.categoryCode,
      sort: currentNode?.sort,
      parentId: currentNode?.parentId,
      // 实际场景中应该根据parentId查询父节点名称
      parentName: currentNode?.parentId ? '上级分类' : '顶级分类',
    });

    setModalVisible(true);
  };

  // 处理删除分类
  const handleDeleteCategory = () => {
    console.log('删除分类被点击:', currentNode);
    setOperationType('delete');
    setHoverActionVisible(false);

    // 显示确认对话框
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${currentNode?.categoryName}"吗？删除后无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          // 调用删除API
          const result = await deleteProductCat(currentNode?.id || '');

          if (result.code === 200) {
            message.success(`成功删除分类：${currentNode?.categoryName}`);
            // 成功后使用setTimeout确保状态更新顺序
            setTimeout(() => {
              // 重新加载树
              fetchCategoryTree();
            }, 0);
          } else {
            message.error(result.msg || '删除分类失败');
            setLoading(false); // 失败时也需要关闭加载状态
          }
        } catch (error) {
          message.error('删除分类失败');
          console.error('删除失败:', error);
          setLoading(false); // 失败时也需要关闭加载状态
        }
      },
    });
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('表单数据:', values);

      // 显示加载状态
      setLoading(true);

      try {
        if (operationType === 'add') {
          // 构建添加分类的数据
          const newCategory: ProductCat = {
            id: '', // ID由后端生成
            categoryName: values.categoryName,
            categoryCode: values.categoryCode,
            parentId: values.parentId || '',
            sort: values.sort || 0,
            createTime: '',
            updateTime: '',
          };

          // 调用添加分类API
          const result = await addProductCat(newCategory);

          if (result.code === 200) {
            message.success(`成功添加分类：${values.categoryName}`);
            // 关闭弹窗
            setModalVisible(false);
            // 使用setTimeout确保状态更新顺序
            setTimeout(() => {
              // 重新加载树
              fetchCategoryTree();
            }, 0);
          } else {
            message.error(result.msg || '添加分类失败');
            setLoading(false); // 失败时也需要关闭加载状态
          }
        } else if (operationType === 'edit' && currentNode) {
          // 构建更新分类的数据
          const updatedCategory: ProductCat = {
            id: currentNode.id,
            categoryName: values.categoryName,
            categoryCode: values.categoryCode,
            parentId: currentNode.parentId, // 保持原父级ID
            sort: values.sort || 0,
            createTime: currentNode.createTime || '',
            updateTime: '',
          };

          // 调用更新分类API
          const result = await updateProductCat(
            currentNode.id,
            updatedCategory
          );

          if (result.code === 200) {
            message.success(`成功更新分类：${values.categoryName}`);
            // 关闭弹窗
            setModalVisible(false);
            // 重新加载树
            fetchCategoryTree();
          } else {
            message.error(result.msg || '更新分类失败');
          }
        }
      } catch (error) {
        console.error('操作失败:', error);
        message.error(
          operationType === 'add' ? '添加分类失败' : '更新分类失败'
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCategoryTree();

    // 组件卸载时清理图表实例
    return () => {
      if (chartInstance) {
        chartInstance.dispose();
      }
    };
  }, []);

  // 点击其他地方关闭操作弹窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 如果弹窗不可见，无需处理
      if (!hoverActionVisible) return;

      // 获取操作按钮DOM元素
      const actionButtons = document.querySelector('.hover-action-buttons');

      // 如果点击的是操作按钮内部元素，不关闭弹窗
      if (actionButtons && actionButtons.contains(e.target as Node)) {
        return;
      }

      // 检查点击是否在图表区域内
      const chartDom = chartRef.current;
      if (chartDom && chartDom.contains(e.target as Node)) {
        // 如果在图表区域内点击，通过echarts来处理
        // 这里不关闭弹窗，因为鼠标悬停会自动管理弹窗显示
        return;
      }

      // 如果点击在其他地方，关闭弹窗
      setHoverActionVisible(false);
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 渲染悬浮操作按钮
  const renderHoverActions = () => {
    if (!hoverActionVisible || !currentNode) return null;

    const buttonStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      margin: '0 5px',
      transition: 'all 0.2s',
    };

    return (
      <div
        className='hover-action-buttons'
        style={{
          position: 'absolute',
          left: `${hoverNodePosition.x}px`,
          top: `${hoverNodePosition.y - 50}px`,
          display: 'flex',
          zIndex: 1000,
          padding: '5px',
          background: 'transparent',
        }}
        onMouseEnter={() => setHoverActionVisible(true)}
        onMouseLeave={() => setHoverActionVisible(false)}
      >
        <div
          style={{ ...buttonStyle, background: THEME_COLORS.secondary }}
          onClick={handleAddSubCategory}
          title='添加子分类'
        >
          <PlusOutlined />
        </div>
        <div
          style={{ ...buttonStyle, background: THEME_COLORS.primary }}
          onClick={handleEditCategory}
          title='编辑分类'
        >
          <EditOutlined />
        </div>
        <div
          style={{ ...buttonStyle, background: THEME_COLORS.accent }}
          onClick={handleDeleteCategory}
          title='删除分类'
        >
          <DeleteOutlined />
        </div>
      </div>
    );
  };

  // 在组件主体内部，添加编码检查函数
  const checkCodeExists = async (rule: any, value: string) => {
    // 如果是编辑模式且编码未改变，则不需要检查
    if (operationType === 'edit' && currentNode?.categoryCode === value) {
      return Promise.resolve();
    }

    // 如果编码为空，由其他规则处理，此处不校验
    if (!value) {
      return Promise.resolve();
    }

    try {
      // 获取当前选中的父节点ID
      const parentId = form.getFieldValue('parentId') || '';
      
      // 调用API检查编码是否存在，传递parentId和分类编码
      const result = await checkCategoryCode(parentId, value);
      if (result.code === 200) {
        if (result.data) {
          // 如果编码已存在，拒绝通过验证
          return Promise.reject(new Error('分类编码已存在，请更换一个'));
        } else {
          // 编码不存在，可以使用
          return Promise.resolve();
        }
      } else {
        // API调用失败，显示错误信息，但允许通过验证
        message.error(result.msg || '验证编码失败');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('检查编码出错:', error);
      message.error('验证编码失败');
      return Promise.resolve();
    }
  };

  // 更新表单定义，添加编码校验
  const formLayout = (
    <Form form={form} layout='vertical'>
      <Form.Item name='parentId' hidden>
        <Input />
      </Form.Item>
      <Form.Item
        label='上级分类'
        name='parentName'
        rules={[{ required: false }]}
        help={!parentNode ? '不选择则创建为顶级分类' : undefined}
      >
        <Input disabled />
      </Form.Item>
      <Form.Item
        label='分类名称'
        name='categoryName'
        rules={[{ required: true, message: '请输入分类名称' }]}
      >
        <Input placeholder='请输入分类名称' maxLength={50} />
      </Form.Item>
      <Form.Item
        label='分类编码'
        name='categoryCode'
        rules={[
          { required: true, message: '请输入分类编码' },
          {
            pattern: /^[A-Za-z0-9_-]{2,30}$/,
            message: '编码只能包含字母、数字、下划线、短横线，长度2-30位',
          },
          { validator: checkCodeExists },
        ]}
      >
        <Input placeholder='请输入分类编码' maxLength={30} />
      </Form.Item>
      <Form.Item
        label='排序'
        name='sort'
        rules={[{ required: true, message: '请输入排序值' }]}
        initialValue={0}
      >
        <InputNumber min={0} max={999} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );

  return (
    <Card
      title={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={4}>产品分类树状图</Title>
          <div style={{ padding: '16px 0' }}>
            <Space>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => {
                  // 添加顶级分类
                  console.log('添加顶级分类');
                  setOperationType('add');
                  setParentNode(null);
                  setCurrentNode(null);

                  // 重置表单
                  form.resetFields();
                  // 清空父分类字段
                  form.setFieldsValue({
                    parentId: '',
                    parentName: '顶级分类',
                  });

                  setModalVisible(true);
                }}
              >
                添加顶级分类
              </Button>
              {/* 其他控制按钮 */}
              <Button
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                title='放大'
              />
              <Button
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                title='缩小'
              />
              <Button
                icon={<ExpandOutlined />}
                onClick={handleReset}
                title='重置视图'
              />
            </Space>
          </div>
        </div>
      }
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
        height: 'calc(100vh - 140px)',
        overflow: 'hidden',
      }}
    >
      <Spin spinning={loading}>
        <div
          ref={chartRef}
          style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
            minHeight: '500px',
            position: 'relative',
          }}
        >
          {/* 确保在条件渲染时，key属性保持稳定，避免重新创建DOM结构 */}
          {!loading && categoryTree.length === 0 ? (
            <Empty 
              key="empty-state"
              description='暂无分类数据' 
              style={{ marginTop: '200px' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => {
                  // 添加顶级分类
                  setOperationType('add');
                  setParentNode(null);
                  setCurrentNode(null);

                  // 重置表单
                  form.resetFields();
                  // 清空父分类字段
                  form.setFieldsValue({
                    parentId: '',
                    parentName: '顶级分类',
                  });

                  setModalVisible(true);
                }}
              >
                添加顶级分类
              </Button>
            </Empty>
          ) : null}

          {/* 悬浮操作按钮 */}
          {renderHoverActions()}
        </div>
      </Spin>

      {/* 分类编辑表单弹窗 */}
      <Modal
        title={operationType === 'add' ? '添加分类' : '编辑分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleFormSubmit}
        okText='确定'
        cancelText='取消'
        destroyOnClose
      >
        {formLayout}
      </Modal>
    </Card>
  );
}
