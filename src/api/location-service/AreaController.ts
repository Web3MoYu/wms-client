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

export function pageAreas(
  page: number,
  pageSize: number,
  areaName: string,
  areaManager: string,
  status: number
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
