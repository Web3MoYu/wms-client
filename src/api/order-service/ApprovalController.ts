import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';
import { OrderQueryDto, OrderVo } from './OrderController';
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
