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
