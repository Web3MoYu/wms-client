import axios from '../../utils/mxAxios';

/**
 * 获取所有菜单列表
 * @returns Promise，包含菜单列表数据
 */
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

/**
 * 根据角色ID获取该角色的菜单权限列表
 * @param id 角色ID
 * @returns Promise，包含该角色可访问的菜单ID列表
 */
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
