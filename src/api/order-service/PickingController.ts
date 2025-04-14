import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';
import { Location, LocationVo } from '../stock-service/StockController';
import { User } from '../sys-service/UserController';
import { OrderDetailVo, OrderOut, OrderOutItem } from './OrderController';

export interface PickingOrderDto {
  // 基本分页参数
  page: number;
  pageSize: number;

  pickingNo: string; // 模糊查询拣货编号
  picker: string; // 精准查找拣货人员
  status: number; // 状态：0-待拣货，1-拣货中，2-已完成

  // 排序条件 true-升序 false-降序
  totalOrdersAsc: boolean;
  totalItemsAsc: boolean;
  totalQuantityAsc: boolean;
  createTimeAsc: boolean;
}

export interface PickingOrder {
  id: string; // 拣货单ID
  pickingNo: string; // 拣货单号
  picker: string; // 拣货人员
  status: number; // 状态：0-待拣货，1-拣货中，2-已完成，3-异常
  remark: string; // 备注
  totalOrders: number; // 包含订单数量
  totalItems: number; // 包含商品种类数
  totalQuantity: number; // 总拣货数量
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface PickingItem {
  id: string; // 明细ID
  pickingId: string; // 拣货单ID
  orderId: string; // 出库订单ID
  orderItemId: string; // 出库订单明细ID
  productId: string; // 产品ID

  productName: string; // 产品名称
  productCode: string; // 产品编码
  batchNumber: string; // 批次号
  areaId: string; // 区域ID
  location: Location[]; // 具体位置

  expectedQuantity: number; // 预期数量
  actualQuantity: number; // 实际拣货数量
  status: number; // 状态：0-待拣货，1-拣货中，2-已完成，3-异常
  remark: string; // 备注
  pickingTime: string; // 拣货时间
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface PickingOrderVo extends PickingOrder {
  pickingUser: User;
}

export interface PickingDetailVo {
  order: OrderOut; // 出库订单
  orderInfo: OrderDetailVo<OrderOutItem>[]; //  出库订单详情
  pickingItems: PickingItemVo[]; // 分拣详情
}

export interface PickingItemVo extends PickingItem {
  areaName: string; // 区域名称
  locations: LocationVo[]; // 具体位置
}

/**
 * 分页查询拣货列表
 *
 * @param dto 分页条件
 * @return 分页数据
 */
export function pickingPage(
  dto: PickingOrderDto
): Promise<Result<Page<PickingOrderVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/picking/page', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 批量增加拣货信息
 *
 * @param ids 出库订单ID列表
 * @return 是否增加成功。
 */
export function batchAddPickings(
  ids: string[],
  picker: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post(`/order/picking/add/${picker}`, ids)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 获取拣货单详情信息
 *
 * @param pickingId 拣货id
 * @return 拣货的详细信息
 */
export function getPickingDetail(
  pickingId: string
): Promise<Result<PickingDetailVo[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/order/picking/pickingDetail/${pickingId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
