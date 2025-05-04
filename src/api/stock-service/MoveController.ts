import axios from '../../utils/mxAxios';
import { Area } from '../location-service/AreaController';
import { Page, Result } from '../Model';
import { User } from '../sys-service/UserController';
import { Location, LocationVo, StockVo } from './StockController';

export interface MovementDto {
  page: number; // 当前页码
  pageSize: number; // 每页条数
  movementNo: string; // 变更编号
  beforeAreaId: string; // 变更前区域
  afterAreaId: string; // 变更后区域
  operator: string; // 操作人
  approver: string; // 审批人
  startDate: string; // 开始时间
  endDate: string; // 结束时间
  status: number; // 状态 -1-拒绝，0-未审批,1-待变动，2-已完成
}

export interface Movement {
  id: string; // 记录ID
  movementNo: string; // 变动编号
  stockId: string; // 库存ID
  beforeAreaId: string; // 变动前区域ID
  beforeLocation: Location[]; // 变动前具体位置
  afterAreaId: string; // 变动后区域ID
  afterLocation: Location[]; // 变动后具体位置
  operator: string; // 操作人
  approver: string; // 审批人
  movementTime: string; // 变动时间
  reason: string; // 拒绝原因
  remark: string; // 备注
  status: number; // 状态 -1-拒绝，0-未审批,1-待变动，2-已完成
  createTime: string; // 创建时间
}

export interface MovementVo extends Movement {
  stock: StockVo;
  beforeArea: Area;
  beforeLocationVo: LocationVo[];
  afterArea: Area;
  afterLocationVo: LocationVo[];
  operatorUser: User;
  approverUser: User;
}

export interface AddMovementDto {
  stockId: string; // 变更的库存ID
  areaId: string; // 变更后的区域ID
  locations: Location[]; // 变更的位置信息
  remark: string; // 备注
}

/**
 * 分页查询变动记录
 * @param dto 变动记录查询条件
 */
export function pageMovement(
  dto: MovementDto
): Promise<Result<Page<MovementVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/move/page', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 新增变动记录
 * @param dto 变动记录新增条件
 */
export function addMovement(dto: AddMovementDto): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/move/add', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 审批变动记录
 * @param id 变动记录ID
 */
export function approveMovement(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/move/approve/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 拒绝变动记录
 * @param id 变动记录ID
 * @param reason 拒绝原因
 */
export function rejectMovement(
  id: string,
  reason: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/move/reject/${id}`, { params: { reason } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
