import axios from '../../utils/mxAxios';
import { User } from '../sys-service/UserController';
import { Page, Result } from '../Model';

export interface InspectionDto {
  // 基本分页参数
  page: number;
  pageSize: number;

  inspectionNo: string; // 质检编号模糊搜索
  inspectionType: number; // 质检类型：1-入库质检，2-出库质检，3-库存质检,为null查询全部
  relatedOrderNo: string; // 订单编号，模糊搜索
  inspector: string; // 质检员

  // 时间范围 对应 Inspection.inspectionTime
  startTime: string; // 开始时间
  endTime: string; // 结束时间

  status: number; // 质检状态：1-通过，2-不通过，3-部分异常,为null查询全部
  createTimeAsc: boolean; // 创建时间排序 true-升序 false-降序
}
export interface Inspection {
  id: string; // 质检ID
  inspectionNo: string; // 质检编号
  inspectionType: number; // 质检类型：1-入库质检，2-出库质检，3-库存质检
  relatedOrderId: string; // 关联订单ID
  relatedOrderNo: string; // 关联订单编号
  inspector: string; // 质检员
  inspectionTime: string; // 质检时间
  status: number; // 质检状态：1-通过，2-不通过，3-部分异常
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface InspectionVo extends Inspection {
  inspectorInfo: User; // 质检员信息
}

/**
 * 查询入库订单列表
 *
 * @param dto 查询条件
 * @return 结果
 */
export function pageList(
  dto: InspectionDto
): Promise<Result<Page<InspectionVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/inspect/page', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
