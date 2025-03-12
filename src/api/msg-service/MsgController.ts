import axios from '../../utils/mxAxios';
import { Result } from '../Model';

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
  type: number; // 通知类型：1-库存预警，2-质检通知，3-订单状态，4-异常通知，5-补货通知，6-其他
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
   * 关联业务类型：1-入库单，2-出库单，3-质检单，4-异常标记，5-库存预警
   */
  relatedBizType: number;
  sendTime: string; // 发送时间
  readTime: string; // 阅读时间
  isSystem: number; // 是否系统通知：0-否，1-是
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
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
