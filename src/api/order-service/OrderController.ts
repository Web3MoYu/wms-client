import axios from '../../utils/mxAxios';
import { User } from '../sys-service/UserController';
import { Page, Result } from '../Model';
import { Product } from '../product-service/ProductController';
import { LocationVo, Location } from '../stock-service/StockController';

export interface OrderVo {
  id: string; // id
  orderNo: string; // 订单编号
  type: number; // 订单类型：1-入库订单，0-出库订单
  creator: User; // 创建人
  approver: User; // 审批人
  inspector: User; // 质检员
  totalAmount: number; // 总金额
  totalQuantity: number; // 总数量
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
  qualityStatus: number; // 质检状态：质检状态：0-未质检，1-质检通过，2-质检不通过，3-部分异常
  remark: string; // 备注
  createTime: string; // 创建时间
  expectedTime: string; // 预计到达时间
  actualTime: string; // 实际到达时间
}

export interface OrderQueryDto {
  // 基本分页参数
  page: number;
  pageSize: number;

  // 订单类型：0-入库订单，1-出库订单，不传为null则查询全部
  orderType: number;

  // 查询条件
  orderNo: string; // 订单编号(模糊查询)
  inspectionStatus: number; // 质检状态
  creatorId: string; // 创建人ID
  approverId: string; // 审核人id
  inspectorId: string; // 质检人员ID
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝

  // 时间范围
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间

  // 排序参数
  createTimeAsc: boolean; // 创建时间排序 true-升序 false-降序
}

export interface OrderIn {
  id: string; // 入库订单id
  orderNo: string; // 订单编号
  type: number; // 类型：0-出库，1入库
  orderType: number; // 订单类型：1-采购入库，2-自动入库
  creator: string; // 创建人
  approver: string; // 审核人
  inspector: string | null; // 质检员
  expectedTime: Date; // 预计到达时间
  actualTime: Date; // 实际到达时间
  totalAmount: number; // 总金额
  totalQuantity: number; // 总数量
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
  qualityStatus: number; // 质检状态：质检状态：0-未质检，1-质检通过，2-质检不通过，3-部分异常
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface OrderInItem {
  id: string; // 明细id
  orderId: string; // 入库订单ID
  productId: string; // 产品ID
  productName: string; // 产品名称
  productCode: string; // 产品编码
  expectedQuantity: number; // 预期数量
  actualQuantity: number; // 实际数量
  price: number; // 单价
  amount: number; // 金额
  areaId: string; // 区域ID
  location: Location[]; // 具体位置
  batchNumber: string; // 批次号
  productionDate: Date; // 生产日期
  expiryDate: Date; // 过期日期
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
  qualityStatus: number; // 质检状态：0-未质检，1-质检通过，2-质检不通过，3-部分异常
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface OrderOut {
  id: string; // 出库订单id
  orderNo: string; // 订单编号
  type: number; // 类型：0-出库，1入库
  orderType: number; // 订单类型：1-销售出库，2-调拨出库，3-其他出库
  creator: string; // 创建人
  approver: string; // 审核人
  inspector: string; // 质检员
  expectedTime: Date; // 预计到达时间
  actualTime: Date; // 实际到达时间
  totalAmount: number; // 总金额
  totalQuantity: number; // 总数量
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
  qualityStatus: number; // 质检状态：质检状态：0-未质检，1-质检通过，2-质检不通过，3-部分异常
  deliveryAddress: string; // 配送地址
  contactName: string; // 联系人
  contactPhone: string; // 联系电话
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface OrderOutItem {
  id: string; // 明细ID
  orderId: string; // 出库订单ID
  productId: string; // 产品ID
  productName: string; // 产品名称
  productCode: string; // 产品编码
  expectedQuantity: number; // 预期数量
  actualQuantity: number; // 实际数量
  price: number; // 单价
  amount: number; // 金额
  areaId: string; // 区域ID
  location: Location[]; // 具体位置
  batchNumber: string; // 批次号
  productionDate: Date; // 生产日期
  expiryDate: Date; // 过期日期
  status: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
  qualityStatus: number; // 质检状态：0-未质检，1-质检通过，2-质检不通过，3-部分异常
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface OrderDto<O, OI> {
  order: O;
  orderItems: OI[];
  products: Map<string, Product>;
}

export interface OrderDetailVo<T> {
  product: Product;
  orderItems: T;
  areaName: string;
  locationName: LocationVo[];
}

/**
 * 按照条件查询订单列表
 * @param queryDto 查询条件
 * @returns 订单列表
 */
export function queryOrders(
  queryDto: OrderQueryDto
): Promise<Result<Page<OrderVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/pageOrder', queryDto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 插入入库订单
 * @param order 入库订单
 */
export function insertOrderIn(
  order: OrderDto<OrderIn, OrderInItem>
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/addOrderIn', order)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 查询入库订单详情
 *
 * @param id 订单ID
 * @return 入库订单详情
 */
export function inDetail(
  id: string
): Promise<Result<OrderDetailVo<OrderInItem>[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/order/inDetail', { params: { id } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 查询出库订单详情
 *
 * @param id 订单ID
 * @return 出库订单详情
 */
export function outDetail(
  id: string
): Promise<Result<OrderDetailVo<OrderOutItem>[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/order/outDetail', { params: { id } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 取消订单
 *
 * @param id     订单ID
 * @param type   订单类型
 * @param remark 备注
 * @return 取消结果
 */
export function cancel(
  id: string,
  type: number,
  remark: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/order/cancel/${type}/${id}`, { params: { remark } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 入库的收货
 *
 * @param id 订单id
 * @return 收货结果
 */
export function receiveGoods(
  id: string,
  type: number
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/order/receive/${type}/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
