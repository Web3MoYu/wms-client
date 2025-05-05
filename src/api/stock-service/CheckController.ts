import axios from '../../utils/mxAxios';
import { Area } from '../location-service/AreaController';
import { Page, Result } from '../Model';
import { User } from '../sys-service/UserController';

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
  status: number; // 状态：0-待盘点，1-盘点中，2-待确认，3-已完成
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
  status: number; // 状态：0-待盘点，1-盘点中，2-待确认，3-已完成
  remark: string; // 备注
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface CheckVo extends Check {
  area: Area;
  creatorUser: User;
  checkerUser: User;
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
