import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface Shelf {
  id: string; // 货架ID
  areaId: string; // 区域ID
  shelfName: string; // 货架名称
  shelfCode: string; // 货架编码
  status: number; // 状态：0-禁用，1-启用 null-表示全部
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface ShelfVo extends Shelf {
  areaName: string; // 区域名称
}

/**
 * 分页查询货架信息，包含区域名称
 *
 * @param page      页码，默认为1
 * @param pageSize  每页条数，默认为10
 * @param shelfName 货架名称（可选，模糊查询）
 * @param areaId    区域ID（可选）
 * @param status    状态（可选，null表示查询所有）
 * @return 货架分页结果，包含区域名称
 */
export function pageShelf(
  page: number,
  pageSize: number,
  shelfName: string,
  areaId: string,
  status: number
): Promise<Result<Page<ShelfVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/shelf/page', {
        params: {
          page,
          pageSize,
          shelfName,
          areaId,
          status,
        },
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
 * 添加货架
 *
 * @param shelf 货架信息
 * @return 添加结果
 */
export function addShelf(shelf: Shelf): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/location/shelf', shelf)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新货架
 *
 * @param shelf 货架信息
 * @return 更新结果
 */
export function updateShelf(shelf: Shelf): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/location/shelf/${shelf.id}`, shelf)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 删除货架
 *
 * @param id 货架ID
 * @return 删除结果
 */
export function deleteShelf(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/location/shelf/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查货架编码是否存在
 *
 * @param areaId 区域ID
 * @param shelfCode 货架编码
 * @return 检查结果
 */
export function checkShelfCode(
  areaId: string,
  shelfCode: string
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/location/shelf/checkShelfCode/${areaId}`, {
        params: {
          shelfCode,
        },
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
 * 检查货架编码是否存在
 *
 * @param areaId 区域ID
 * @param shelfName 货架名称
 * @return 检查结果
 */
export function checkShelfName(
  areaId: string,
  shelfName: string
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/location/shelf/checkShelfName/${areaId}`, {
        params: {
          shelfName,
        },
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
 * 根据区域id获取货架列表
 *
 * @param areaId 区域ID
 * @return 货架列表
 *
 */
export function getShelfListByAreaId(areaId: string): Promise<Result<Shelf[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/location/shelf/getShelves/${areaId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 批量新增货架
 *
 * @param shelves 货架列表
 * @return 新增结果
 */
export function addShelfBatch(shelves: Shelf[]): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/location/shelf/batchAdd', shelves)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
