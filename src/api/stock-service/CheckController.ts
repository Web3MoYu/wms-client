import axios from '../../utils/mxAxios';
import { Area } from '../location-service/AreaController';
import { Page, Result } from '../Model';
import { User } from '../sys-service/UserController';
import { StockVo } from './StockController';

export interface CheckQueryDto {
  page: number; // 当前页码
  pageSize: number; // 每页条数
  checkNo: string; // 盘点单号
  areaId: string; // 区域ID
  creator: string; // 创建人
  checker: string; // 盘点人
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  actualStartTime: string; // 实际开始时间
  actualEndTime: string; // 实际结束时间
  status: number; // 状态：-1: 已废弃，0-待盘点，1-待确认，2-已完成
}

export interface Check {
  id: string; // 盘点ID
  checkNo: string; // 盘点单号
  areaId: string; // 区域ID
  creator: string; // 创建人
  checker: string; // 盘点人
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  actualStartTime: string; // 实际开始时间
  actualEndTime: string; // 实际结束时间
  status: number; // 状态：-1: 已废弃，0-待盘点，1-待确认，2-已完成
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface CheckItem {
  id: string; // 明细ID
  checkId: string; // 盘点单ID
  stockId: string; // 库存ID
  systemQuantity: number; // 系统数量
  actualQuantity: number; // 实际数量
  differenceQuantity: number; // 差异数量
  status: number; // 状态：-1: 已废弃，0-待盘点，2-已盘点
  isDifference: number; // 是否有差异：0-无，1-有
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface CheckItemVo extends CheckItem {
  stock: StockVo;
}

export interface CheckVo extends Check {
  area: Area;
  creatorUser: User;
  checkerUser: User;
}

export interface AddCheckDto {
  areaId: string; // 区域ID
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  remark: string; // 备注
}

export interface StockCheckDto {
  checkItemId: string; // 盘点单明细ID
  actualQuantity: number; // 实际数量
}

/**
 * 分页查询盘点单
 * @param dto 盘点单查询条件
 * @returns 盘点单列表
 */
export function pageCheck(dto: CheckQueryDto): Promise<Result<Page<CheckVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/check/page', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 新增盘点单
 */
export function addCheck(dto: AddCheckDto): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/check/add', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 查询盘点单明细
 * @param id 盘点单ID
 * @returns 盘点单明细列表
 */
export function detailCheck(id: string): Promise<Result<CheckItemVo[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/check/detail/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 开始盘点
 * @param dto 盘点单明细列表
 * @returns 盘点单ID
 */
export function startCheck(dto: StockCheckDto[]): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/check/startCheck', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
