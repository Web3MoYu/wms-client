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

export function bindWechat(params: {
  wxid: string;
  username: string;
  password: string;
}) {
  return new Promise((resolve, reject) => {
    axios
      .post('/auth/wx/bind', params)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
