import axios from '../../utils/mxAxios';
import { Result } from '../Model';

export interface CountVo {
  name: string; // 名称
  count: number; // 数量
}

export interface StockCountVo {
  name: string;
  batchCount: CountVo[];
}

export interface StorageCountVo {
  totalCount: number;
  freeCount: number;
  occupiedCount: number;
  disabledCount: number;
}

/**
 * 统计用户数量
 *
 * @return 用户数量
 */
export function countUser(): Promise<Result<number>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/user/countUser')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 统计产品数量
 *
 * @return 产品数量
 */
export function countProduct(): Promise<Result<number>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/countProduct')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 统计产品分类和数量
 *
 * @return 产品分类和数量
 */
export function countCat(): Promise<Result<CountVo[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/cat/countCat')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 统计库存数量
 *
 * @return 库存数量
 */
export function countStock(): Promise<Result<StockCountVo[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/stock/countStock')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 统计库存种类数
 */
export function countStockCat(): Promise<Result<number>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/stock/countStockCat')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 统计订单数量
 *
 * @return 只有两个大小的数组，第一个是入库订单数量，第二个是出库订单数量
 */
export function getOrderCount(): Promise<Result<number[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/order/getOrderCount')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 统计库位信息占有情况
 *
 * @return 库位信息统计数据F
 */
export function countStorage(): Promise<Result<StorageCountVo>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/location/storage/countStorage')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
