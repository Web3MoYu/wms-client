import axios from '../../utils/mxAxios';

export function getMenuList() {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/menu/list')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function listById(id: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/menu/list/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
