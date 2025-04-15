import axios from '../../utils/mxAxios';
import { Result } from '../Model';

export interface ProductCatCountVo {
  catName: string; // 分类名称
  productCount: number; // 产品数量
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
export function countCat(): Promise<Result<ProductCatCountVo[]>> {
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
