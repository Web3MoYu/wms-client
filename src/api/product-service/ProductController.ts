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
