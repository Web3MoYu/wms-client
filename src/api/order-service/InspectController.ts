import axios from '../../utils/mxAxios';
import { User } from '../sys-service/UserController';
import { Page, Result } from '../Model';
import { Location } from '../stock-service/StockController';
import { OrderDetailVo, OrderInItem, OrderOutItem } from './OrderController';

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

  status: number; // 质检状态：0-未质检，1-通过，2-不通过，3-部分异常,为null查询全部
  receiveStatus: number; // 上架状态：0-未上架，1-已完成，2-进行中，为null查询全部
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
  status: number; // 质检状态：0-未质检，1-通过，2-不通过，3-部分异常,为null查询全部
  receiveStatus: number; // 上架状态：0-未上架，1-已完成，2-进行中，为null查询全部
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface InspectionItem {
  id: string; // 明细ID
  inspectionId: string; // 质检记录ID
  productId: string; // 产品ID
  batchNumber: string; // 批次号
  areaId: string; // 区域id
  location: Location[]; // 具体位置
  inspectionQuantity: number; // 质检数量
  qualifiedQuantity: number; // 合格数量
  unqualifiedQuantity: number; // 不合格数量
  qualityStatus: number; // 质检结果：1-合格，2-不合格
  receiveStatus: number; // 上架状态：0-未上架，1-已完成，2-进行中，为null查询全部
  reason: string; // 异常原因
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface InspectionVo extends Inspection {
  inspectorInfo: User; // 质检员信息
  orderStatus: number; // 状态：0-待审核，1-审批通过，2-入库中/出库中，3-已完成，-1-已取消，-2-审批拒绝
}

export interface ItemInspect {
  itemId: string; // 质检详情id
  productId: string; // 产品id
  actualQuantity: number; // 实际数量
  count: number; // 合格数量
  remark: string; // 质检详情备注
  approval: boolean; // 通过
}

export interface InBoundInspectDto {
  itemInspects: ItemInspect[];
  remark: string; // 订单备注
  inspectionNo: string; // 质检编号
}

export interface InspectionDetailVo<T> {
  orderDetail: OrderDetailVo<T>[];
  inspectionItems: InspectionItem[];
}

export interface StockInDto {
  itemId: string; // 订单详情id
  productId: string; // 产品id
  count: number; // 上架数量
  locations: Location[]; // 位置信息
}

export interface InspectStatisticsVo {
  count: number; // 质检单数量
  status: number; // 质检状态：0-未质检，1-通过，2-不通过，3-部分异常
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

/**
 * 入库质检
 *
 * @param dto 质检信息
 * @return 结果
 */
export function inBoundCheck(dto: InBoundInspectDto): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/order/inspect/inBoundCheck', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 入库质检详情
 *
 * @param id 质检ID
 * @return 结果
 */
export function inInspectDetail(
  id: string
): Promise<Result<InspectionDetailVo<OrderInItem>>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/order/inspect/inDetail', { params: { id } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 出库质检详情
 *
 * @param id 质检ID
 * @return 结果
 */
export function outInspectDetail(
  id: string
): Promise<Result<InspectionDetailVo<OrderOutItem>>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/order/inspect/outDetail', { params: { id } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 确认上架
 *
 * @param inspectNo 质检编号
 * @return 上架结果
 */
export function stockAll(inspectNo: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/order/inspect/stockAll/${inspectNo}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 上架单个商品
 *
 * @param dto 商品信息
 * @return 上架结果
 */
export function stockOne(dto: StockInDto): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put('/order/inspect/stockOne', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 获取质检统计信息
 *
 * @param type  all-全部，in-入库，out-出库
 * @param range 时间范围：1day, 1week, 1month, 3months, 6months
 * @return 统计信息
 */
export function getInspectionStatistics(
  range: string,
  type: string
): Promise<Result<InspectStatisticsVo[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/order/inspect/statistics/${type}`, { params: { range } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
