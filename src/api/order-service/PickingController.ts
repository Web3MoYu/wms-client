import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

interface PickingOrderDto {
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

interface PickingOrder {
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

/**
 * 分页查询拣货列表
 *
 * @param dto 分页条件
 * @return 分页数据
 */
export function pickingPage(
  dto: PickingOrderDto
): Promise<Result<Page<PickingOrder>>> {
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
