import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface Area {
  id: string; // 区域ID
  areaName: string; // 区域名称
  areaCode: string; // 区域编码
  areaManager: string; // 区域负责人
  status: number; // 状态：0-禁用，1-启用
  description: string; // 区域描述
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface AreaVo extends Area {
  areaManagerName: string; // 区域负责人名称
}

/**
 * 分页获取区域列表
 */
export function pageAreas(
  page: number,
  pageSize: number,
  areaName: string,
  areaManager: string,
  status: number | null
): Promise<Result<Page<AreaVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .get<AreaVo[]>('/location/area/page', {
        params: {
          page,
          pageSize,
          areaName,
          areaManager,
          status,
        },
      })
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err) => reject(err));
  });
}

/**
 * 添加区域
 */
export function addArea(area: Area): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/location/area', area)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新区域
 */
export function updateArea(id: string, area: Area): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/location/area/${id}`, area)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 删除区域
 */
export function deleteArea(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/location/area/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查区域编码是否存在
 */
export function checkAreaCode(areaCode: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/area/checkAreaCode', {
        params: { areaCode },
      })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查区域是否重复
 */
export function checkAreaName(areaName: string): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/area/checkAreaName', { params: { areaName } })
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}
