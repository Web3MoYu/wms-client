import axios from '../../utils/mxAxios';
import { Page, Result } from '../Model';

export interface WSModel<T> {
  data: T;
  /**
   * 消息类型
   * 0：心跳包
   * 1: 消息提醒
   */
  type: number;
}

export interface Msg {
  id: string; // 通知ID
  type: number; // 通知类型：1-库存预警，2-质检通知，3-订单状态，4-库位变更，5-库存盘点，6-其他
  title: string; // 通知标题
  content: string; // 通知内容
  recipientId: string; // 接收人ID
  recipientName: string; // 接收人姓名
  senderId: string; // 发送人ID
  senderName: string; // 发送人姓名
  readStatus: number; // 阅读状态：0-未读，1-已读
  priority: number; // 优先级：0-普通，1-重要，2-紧急
  relatedBizId: string; // 关联业务ID
  /**
   * 关联业务类型：1-入库单，2-出库单，3-质检单，4-库位变更，5-库存预警，6-库存盘点
   */
  relatedBizType: number;
  sendTime: string; // 发送时间
  readTime: string; // 阅读时间
  isSystem: number; // 是否系统通知：0-否，1-是
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
}

export interface MsgPageDto {
  senderId: string;
  type: string;
  title: string;
  readStatus: number;
  priority: number;
  startTime: Date;
  endTime: Date;
  page: number;
  pageSize: number;
}

/**
 * 统计是否存在未读消息
 */
export function getUnReadMsgCount(): Promise<Result<boolean>> {
  return new Promise<Result<boolean>>((resolve, reject) => {
    axios
      .get('/msg/countUnReadMsg')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 分页查询消息
 *
 * @param dto 分页查询消息请求参数
 * @return 分页查询消息响应结果
 */
export function page(dto: MsgPageDto): Promise<Result<Page<Msg>>> {
  return new Promise<Result<Page<Msg>>>((resolve, reject) => {
    axios
      .post('/msg/page', dto)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**
 * 获取未读消息
 *
 * @return 未读消息列表
 */
export function getUnReadMsg(): Promise<Result<Msg[]>> {
  return new Promise<Result<Msg[]>>((resolve, reject) => {
    axios
      .get('/msg/getUnReadMsg')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 获取已读消息
 *
 * @return 已读消息列表
 */
export function getReadMsg(): Promise<Result<Msg[]>> {
  return new Promise<Result<Msg[]>>((resolve, reject) => {
    axios
      .get('/msg/getReadMsg')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 读消息
 *
 * @param id id
 * @return 返回结果
 */
export function readMsg(id: string): Promise<Result<string>> {
  return new Promise<Result<string>>((resolve, reject) => {
    axios
      .put(`/msg/read/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
