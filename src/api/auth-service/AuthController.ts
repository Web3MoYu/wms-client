import axios from '../../utils/mxAxios';

export interface LoginDto {
  username: string;
  password: string;
}

/**
 * 用户登录
 * @param user 包含用户名和密码的登录信息对象
 * @returns 返回Promise，包含登录结果
 */
export function login(user: LoginDto) {
  return new Promise((resolve, reject) => {
    axios
      .post('/auth/login', user)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 绑定微信账号
 * @param params 包含用户名和密码的对象
 * @param wxid 微信ID
 * @returns 返回Promise，包含绑定结果
 */
export function bindWechat(
  params: {
    username: string;
    password: string;
  },
  wxid: string
) {
  return new Promise((resolve, reject) => {
    axios
      .post(`/auth/wx/bind/${wxid}`, params)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 用户退出登录
 * @returns 返回Promise，包含退出登录结果
 */
export function logout() {
  return new Promise((resolve, reject) => {
    axios
      .get('/auth/logout')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 根据token获取用户信息
 * @returns Promise，包含用户信息
 */
export function validateToken() {
  return new Promise((resolve, reject) => {
    axios
      .get('/auth/token')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新用户个人信息
 * @param user 用户信息对象
 * @param uploaded 是否上传了新头像的标志(0:未上传，1:已上传)
 * @returns Promise，包含更新结果
 */
export function updateUserInfo(user: any, uploaded: number) {
  return new Promise((resolve, reject) => {
    axios
      .put(`/sys/user/personal/${uploaded}`, user)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 修改用户密码
 * @param params 包含旧密码和新密码的对象
 * @returns Promise，包含修改结果
 */
export function updatePassword(params: { oldPass: string; newPass: string }) {
  return new Promise((resolve, reject) => {
    axios
      .put('/auth/modifyPass', params)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
