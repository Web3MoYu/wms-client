import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface Product {
  id: string;
  productName: string; // 产品名称
  productCode: string; // 产品编码
  categoryId: string; // 分类id
  brand: string; // 品牌
  model: string; // 型号
  spec: string; // 规格
  price: string; // 价格
  minStock: number; // 最小库存
  maxStock: number; // 最大库存
  imageUrl: string; // 图片URL
  description: string; // 描述
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface ProductVo extends Product {
  categoryName: string; // 分类名称
}
/**
 * 分页获取商品列表
 * @param page 页码
 * @param pageSize 每页条数
 * @param productName 商品名称
 * @param categoryId 分类id
 * @param brand 品牌
 */
export function pageProducts(
  page: number,
  pageSize: number,
  productName: string,
  categoryId: string,
  brand: string
): Promise<Result<Page<ProductVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/page', {
        params: {
          page,
          pageSize,
          productName,
          categoryId,
          brand,
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
 * 检查产品编码是否存在
 * @param productCode 产品编码
 * @returns 是否存在
 */
export function checkProductCode(
  productCode: string
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/checkCode', {
        params: { productCode },
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
 * 根据id删除商品
 * @param id 商品id
 * @returns 是否删除成功
 */
export function deleteProduct(id: string): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/product/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 新增商品
 * @param product 商品信息
 * @returns 是否新增成功
 */
export function addProduct(product: Product): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/product', product)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 更新商品
 * @param product 商品信息
 * @returns 是否更新成功
 */
export function updateProduct(
  id: string,
  product: Product
): Promise<Result<boolean>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/product/${id}`, product)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 根据商品名模糊查询商品列表
 * @param productName 商品名称
 * @returns 商品列表
 */
export function searchProducts(
  productName: string
): Promise<Result<Product[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/product/list/${productName}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 生成一个批次号
 */
export function generateBatchNumber(): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/product/batchNumber')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 根据id获取商品详情
 * @param id 商品id
 * @returns 商品详情
 */
export function getProductById(id: string): Promise<Result<ProductVo>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/product/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
