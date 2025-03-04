import axios from '../../utils/mxAxios';
import { Result } from '../Model';

export interface ProductCat {
  id: string; // id
  categoryName: string; // 分类名称
  categoryCode: string; // 分类编码
  parentId: string; // 父级ID
  sort: number; // 排序
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface ProductCatTree {
  category: ProductCat;
  children: ProductCatTree[]; // 子级分类
}

/**
 * 获取商品分类树
 * @returns Promise，包含商品分类树数据
 */
export function getProductCatTree(): Promise<Result<ProductCatTree[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/cat/tree')
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 检查分类编码是否存在
 * @param categoryCode 分类编码
 * @returns 是否存在
 */
export function checkCategoryCode(
  parentId: string,
  categoryCode: string
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/product/cat/check/${parentId}/${categoryCode}`)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 添加商品分类
 * @param productCat 商品分类
 * @returns 结果
 */
export function addProductCat(productCat: ProductCat): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/product/cat/add', productCat)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 更新商品分类
 * @param id 分类ID
 * @param productCat 商品分类
 * @returns 结果
 */
export function updateProductCat(
  id: string,
  productCat: ProductCat
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/product/cat/update/${id}`, productCat)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 删除商品分类
 * @param id 分类ID
 * @returns 结果
 */
export function deleteProductCat(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/product/cat/delete/${id}`)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}
