import axios from '../../utils/mxAxios';

export interface User {
  userId: string;
  wxId: string | null;
  username: string;
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

export function getUsers(page: number, pageSize: number, nickName: string) {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/user/list', {
        params: {
          page,
          pageSize,
          nickName,
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
 * 添加用户
 * @param user 用户信息
 * @returns
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
 *
 * @param user 更新用户信息, 其中resetPassword为true时，密码会重置
 * @param userId 更新谁的用户信息
 * @returns
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
