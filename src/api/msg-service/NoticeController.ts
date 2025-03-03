import { Page, Result } from '../Model';
import axios from '../../utils/mxAxios';

export interface Notice {
  id: number;
  title: string;
  content: string;
  publier: string;
  publishTime: string;
  endTime: string;
  status: number; // 0: 未发布，1: 已发布，2: 废弃
  priority: number; // 0: 普通，1: 重要，2: 紧急
  isTop: number; // 0: 不置顶，1: 置顶
  createTime: string;
  updateTime: string;
  publisherName: string;
}

export interface NoticePageDTO {
  page: number;
  pageSize: number;
  status: number;
  priority: number;
  isTop: number;
}

/**
 * 获取公告列表
 * @param data 公告列表查询条件
 * @returns Promise，包含公告列表数据
 */
export function pageList(data: NoticePageDTO): Promise<Result<Page<Notice>>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/msg/notice/pageList', data)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 更新公告
 * @param id 公告ID
 * @param data 公告数据
 * @returns Promise，包含更新结果
 */
export function updateNotice(
  id: string,
  data: Notice
): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/msg/notice/update/${id}`, data)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 废弃公告
 * @param id 公告ID
 * @returns Promise，包含废弃结果
 */
export function abandon(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/msg/notice/abandon/${id}`)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 添加公告
 * @param data 公告数据
 * @returns Promise，包含添加结果
 */
export function add(data: Notice): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .post('/msg/notice/add', data)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}

/**
 * 发布公告
 * @param id 公告ID
 * @returns Promise，包含发布结果
 */
export function publish(id: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    axios
      .put(`/msg/notice/publish/${id}`)
      .then((res: any) => {
        resolve(res.data);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
}
