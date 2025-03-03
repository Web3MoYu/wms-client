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
}

export interface NoticePageDTO {
  page: number;
  pageSize: number;
  status: number;
  priority: number;
  isTop: number;
}

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
