import axios from '../../utils/mxAxios';
import { Result } from '../Model';

export interface User {
  userId: string;
  wxId: string | null;
  username: string;
  realName: string;
  password: string | null;
  salt: string | null;
  phone: string;
  email: string | null;
  nickName: string;
  sex: number;
  avatar: string | null;
  createTime: string | null;
  updateTime: string | null;
  roleId: string;
  resetPassword: boolean;
}

/**
 * 分页获取用户列表
 * @param page 页码
 * @param pageSize 每页条数
 * @param nickName 昵称（可选筛选条件）
 * @returns Promise，包含分页用户数据
 */
export function getUsers(
  page: number,
  pageSize: number,
  nickName: string,
  realName: string
) {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/user/list', {
        params: {
          page,
          pageSize,
          nickName,
          realName,
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
 * 添加新用户
 * @param user 用户信息对象
 * @returns Promise，包含添加结果
 */
export function addUser(user: User) {
  return new Promise((resolve, reject) => {
    axios
      .post('/sys/user/add', user)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新用户信息
 * @param user 用户信息对象，其中resetPassword为true时，密码会重置
 * @param userId 用户ID
 * @returns Promise，包含更新结果
 */
export function updateUser(user: User, userId: string) {
  return new Promise((resolve, reject) => {
    axios
      .put(`/sys/user/edit/${userId}`, user)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查用户名是否已存在
 * @param username 用户名
 * @returns Promise，结果中data为true表示已存在
 */
export function checkUsername(username: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/user/username/${username}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查手机号是否已存在
 * @param phone 手机号
 * @returns Promise，结果中data为true表示已存在
 */
export function checkPhone(phone: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/user/phone/${phone}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 检查邮箱是否已存在
 * @param email 邮箱
 * @returns Promise，结果中data为true表示已存在
 */
export function checkEmail(email: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/user/email/${email}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 删除用户
 * @param userId 用户ID
 * @returns Promise，包含删除结果
 */
export function deleteUser(userId: string) {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/sys/user/delete/${userId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 获取管理员列表
 * @returns Promise，包含管理员列表
 */
export function getAdminList(): Promise<Result<User[]>> {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/user/admin/list')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
