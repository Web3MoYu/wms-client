import { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Space,
  Card,
  Typography,
  Divider,
} from 'antd';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  getAllAreas,
  Area,
} from '../../../api/location-service/AreaController';
import {
  AddCheckDto,
  addCheck,
} from '../../../api/stock-service/CheckController';
import AreaStocksTable from './AreaStocksTable';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

interface CheckAddDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckAddDrawer({
  visible,
  onClose,
  onSuccess,
}: CheckAddDrawerProps) {
  const [form] = Form.useForm();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  // 在抽屉打开时初始化
  useEffect(() => {
    if (visible) {
      fetchAreas();
      form.resetFields();
      setSelectedAreaId('');
    }
  }, [visible, form]);

  // 获取所有区域
  const fetchAreas = async () => {
    try {
      const res = await getAllAreas();
      if (res.code === 200) {
        setAreas(res.data);
      }
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  };

  // 处理区域变更
  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 组装提交数据
      const dateRange = values.planDateRange;
      const submitData: AddCheckDto = {
        areaId: values.areaId,
        planStartTime: dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        planEndTime: dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
        remark: values.remark || '',
      };

      const result = await addCheck(submitData);

      if (result.code === 200) {
        message.success('新增盘点成功');
        onSuccess();
        form.resetFields();
      } else {
        message.error(result.msg || '操作失败');
      }
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('表单验证失败，请检查填写内容');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title='新增库存盘点'
      width={1300}
      push={false}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} type='primary' loading={loading}>
            提交
          </Button>
        </Space>
      }
    >
      <Form form={form} layout='vertical'>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name='areaId'
              label='选择盘点区域'
              rules={[{ required: true, message: '请选择盘点区域' }]}
            >
              <Select
                placeholder='请选择区域'
                onChange={handleAreaChange}
                style={{ width: '100%' }}
              >
                {areas.map((area) => (
                  <Option key={area.id} value={area.id}>
                    {area.areaName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='planDateRange'
              label='计划盘点时间'
              rules={[{ required: true, message: '请选择计划盘点时间' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                showTime
                locale={locale}
                format='YYYY-MM-DD HH:mm:ss'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name='remark' label='备注'>
          <TextArea rows={4} placeholder='请输入盘点备注信息' />
        </Form.Item>
      </Form>

      <Divider orientation='left'>
        <Title level={5} style={{ margin: 0 }}>
          区域库存信息
        </Title>
      </Divider>

      <div style={{ marginTop: 16 }}>
        {selectedAreaId ? (
          <Card bordered={false}>
            <AreaStocksTable areaId={selectedAreaId} />
          </Card>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              background: '#f9f9f9',
              borderRadius: '4px',
            }}
          >
            <Typography.Text type='secondary'>
              请先选择区域查看库存信息
            </Typography.Text>
          </div>
        )}
      </div>
    </Drawer>
  );
}
