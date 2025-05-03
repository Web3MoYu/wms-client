import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';
import { User } from '../sys-service/UserController';
import { Stock, StockVo } from './StockController';

export interface AlertQueryDto {
  page: number; // 当前页码
  pageSize: number; // 每页条数
  alertType: number; // 1-低于最小库存，2-超过最大库存
  startDate: string; // 开始时间
  endDate: string; // 结束时间
  isHandled: number; // 是否处理：0-否，1-是
  handler: string; // 处理人
}

export interface Alert {
  id: string; // 记录ID
  stockId: string; // 库存ID
  currentQuantity: number; // 当前数量
  minStock: number; // 最小库存
  maxStock: number; // 最大库存
  alertType: number; // 预警状态：0-正常，1-低于最小库存，2-超过最大库存
  alertTime: string; // 预警时间
  isHandled: number; // 是否处理：0-否，1-是
  handler: string; // 处理人
  handlingTime: string; // 处理时间
  handlingMethod: string; // 处理方法
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface AlertVo extends Alert {
  stock: StockVo;
  handlerUser: User;
}

/**
 * 分页查询预警信息
 * @param dto 查询条件
 */
export function alertPages(dto: AlertQueryDto): Promise<Result<Page<AlertVo>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/stock/alert/pages', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新预警配置
 * @param stock 库存信息
 */
export function updateAlertConfig(stock: Stock): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put('/stock/alert/updateAlertConfig', stock)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
