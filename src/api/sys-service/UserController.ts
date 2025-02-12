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
}

export function getUsers(page: number, pageSize: number, nickName: string) {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/list', {
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
