import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface Stock {
  id: string; // 库存ID
  productId: string; // 产品ID
  productCode: string; // 产品编码
  areaId: string; // 区域ID
  location: MyLocation[]; // 具体位置，格式
  quantity: number; // 数量
  availableQuantity: number; // 可用数量
  alertStatus: number; // 预警状态：0-正常，1-低于最小库存，2-超过最大库存 null-显示所有
  batchNumber: string; // 批次号
  productionDate: string; // 生产日期
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface MyLocation {
  shelfId: string; // 货架ID
  storageIds: string[]; // 库位ID
}

export interface LocationVo {
  shelfName: string; // 货架名称
  storageNames: string[]; // 库位名称
}

export interface StockVo extends Stock {
  productName: string; // 商品名字
  areaName: string; // 区域名称
  locationVo: LocationVo[]; // 位置信息
}

export interface StockDto {
  page: number; // 当前页码
  pageSize: number; // 每页条数
  productId: string; // 商品ID
  areaId: string; // 区域ID
  status: number; // 状态
  batchNumber: string; // 批次号
  ascSortByProdDate: boolean | null; // 是否按生产日期升序排序
  ascSortByQuantity: boolean | null; // 是否按数量生序排序
  ascSortByAvailableQuantity: boolean | null; // 是否按可用数量生序排序
}
/**
 * 获取库存列表
 * @param stockDto 库存查询条件
 */
export function getStockList(
  stockDto: StockDto
): Promise<Result<Page<StockVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/page', stockDto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => reject(err));
  });
}

/**
 * 新增库存信息
 * @param stock 库存信息
 */
export function addStock(stock: Stock): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/add', stock)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}

/**
 * 更新库存信息
 * @param stock 库存信息
 */
export function updateStock(stock: Stock): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put('/stock/update', stock)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}

/**
 * 查询批次号
 * @param batchNumber 批次号
 */
export function getBatchNumberByCode(
  code: string,
  batchNumber: string
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/getBatchNumber/${code}/${batchNumber}`)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}

/**
 * 查询批次号
 * @param batchNumber 批次号
 */
export function getBatchNumber(batchNumber: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/getBatchNumber/${batchNumber}`)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}
/**
 * 根据商品id和批次号查询库存
 * @param productId 商品id
 * @param batchNumber 批次号
 */
export function getStockByProductIdAndBatchNumber(
  productId: string,
  batchNumber: string
): Promise<Result<StockVo>> {
  return new Promise((resolve, reject) => {
    axios
      .get(`/stock/getStockByBatchAndProduct`, {
        params: {
          productId,
          batchNumber,
        },
      })
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
}
