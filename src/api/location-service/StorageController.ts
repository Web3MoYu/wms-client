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
