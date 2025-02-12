import axios from '../../utils/mxAxios';

export interface LoginDto {
  username: string;
  password: string;
}

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
