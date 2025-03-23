import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';
import { MyLocation } from '../stock-service/StockController';
import { OrderQueryDto, OrderVo } from './OrderController';

export interface ApprovalDto {
  id: string; // 详情id
  areaId: string; // 区域id
  productId: string; // 产品id
  location: MyLocation[]; // 位置
}

/**
 * 分页查询审批订单信息
 *
 * @param queryDto 查询条件s
 * @return 订单分页数据
 */
export function pageOrder(
  queryDto: OrderQueryDto
): Promise<Result<Page<OrderVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/approval/pageOrder', queryDto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 拒绝审批
 * @param id 订单id
 * @param type 订单类型
 * @param remark 拒绝理由
 * @returns 拒绝结果
 */
export function reject(
  id: string,
  type: number,
  remark: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/order/approval/reject/${type}/${id}`, {}, { params: { remark } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 审批入库订单
 *
 * @param dto 审批信息
 * @param id  订单ID
 * @return 审批结果
 */
export function approveInbound(
  dto: ApprovalDto[],
  id: string,
  inspector: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post(`/order/approval/${id}/${inspector}`, dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
