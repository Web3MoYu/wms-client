import axios from '../../utils/mxAxios';
import { User } from '../sys-service/UserController';
import { Page, Result } from '../Model';

export interface OrderVo {
  id: string; // id
  orderNo: string; // 订单编号
  type: number; // 订单类型：1-入库订单，0-出库订单
  creator: User; // 创建人
  approver: User; // 审批人
  inspector: User; // 质检员
  totalAmount: number; // 总金额
  totalQuantity: number; // 总数量
  status: number; // 状态：0-待审核，1-已审核，2-部分完成，3-已完成，-1-已取消
  qualityStatus: number; // 质检状态：质检状态：0-未质检，1-质检通过，2-质检不通过
  remark: string; // 备注
  createTime: string; // 创建时间
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

  // 时间范围
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间

  // 排序参数
  createTimeAsc: boolean; // 创建时间排序 true-升序 false-降序
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
