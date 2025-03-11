import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface Storage {
  id: string; // 库位id
  areaId: string; // 区域ID
  shelfId: string; // 货架ID
  locationCode: string; // 库位编码
  locationName: string; // 库位名称
  status: number; // 状态：0-占用，1-空闲，2-禁用
  productId: string; // 当前存放的产品ID
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface StorageVo extends Storage {
  areaName: string; // 区域名称
  shelfName: string; // 货架名称
  productName: string; // 产品名称
}

/**
 * 分页查询库位信息
 *
 * @param page      当前页
 * @param pageSize         每页大小
 * @param areaId       区域ID
 * @param shelfId      货架ID
 * @param status       状态
 * @param locationName 库位名称
 * @param productId    产品ID
 * @return 分页结果
 */
export function pageStorages(
  page: number,
  pageSize: number,
  areaId: string,
  shelfId: string,
  status: number,
  locationName: string,
  productId: string
): Promise<Result<Page<StorageVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/storage/page', {
        params: {
          page,
          pageSize,
          areaId,
          shelfId,
          status,
          locationName,
          productId,
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
 * 检查库位信息是否存在
 * @param locationCode 库位编码
 * @param shelfId 货架ID
 * @param areaId 区域ID
 * @return 是否存在 false 不存在 true 存在
 */
export function checkStorageExists(
  locationCode: string,
  shelfId: string,
  areaId: string
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/storage/checkCode', {
        params: { locationCode, shelfId, areaId },
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
 * 新增库位信息
 * @param storage 库位信息
 * @return 新增结果
 */
export function addStorage(storage: Storage): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/location/storage', storage)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 修改库位信息
 * @param storage 库位信息
 * @return 修改结果
 */
export function updateStorage(
  id: string,
  storage: Storage
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/location/storage/${id}`, storage)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 禁用库位信息
 * @param id 库位ID
 * @return 禁用结果
 */
export function deleteStorage(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/location/storage/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 批量新增库位信息
 * @param storages 库位信息列表
 * @return 新增结果
 */
export function addBatchStorage(storages: Storage[]): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/location/storage/batch', storages)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 根据货架ID获取所有库位
 * @param shelfId 货架ID
 * @return 库位列表
 */
export function getStoragesByShelfId(
  shelfId: string
): Promise<Result<Storage[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/location/storage/getStorageById/${shelfId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 根据ids获取库位信息
 * @param ids 库位ids
 * @return 库位信息列表
 */
export function getStoragesByIds(ids: string[]): Promise<Result<Storage[]>> {
  return new Promise((resolve, reject) => {
    // 将数组转换为逗号分隔的字符串
    const idsString = ids.join(',');
    axios
      .get('/location/storage/getStoragesByIds', { 
        params: { 
          ids: idsString // 后端Spring会自动将逗号分隔的字符串转换为List<String>
        } 
      })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
