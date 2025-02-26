import axios from '../../utils/mxAxios';

export function getRoleById(roleId: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/role/list/${roleId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 获取角色列表
 * @returns
 */
export function getRoleList() {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/role/list')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
