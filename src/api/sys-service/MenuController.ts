import axios from '../../utils/mxAxios';

export interface MenuItem {
  menuId: string;
  icon: string;
  title: string;
  code: string;
  name: string;
  menuUrl: string;
  routePath: string;
  componentPath: string;
  type: number;
}

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

/**
 * 获取非按钮菜单
 * @returns Promise，包含非按钮菜单列表数据
 */
export function getContentList() {
  return new Promise((resolve, reject) => {
    axios
      .get('/sys/menu/getContent')
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 添加菜单
 * @param data 菜单数据
 * @returns Promise，包含添加结果
 */
export function addMenu(data: MenuItem) {
  return new Promise((resolve, reject) => {
    axios
      .post('/sys/menu/add', data)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新菜单
 * @param data 菜单数据
 * @param id 菜单ID
 * @returns Promise，包含更新结果
 */
export function updateMenu(data: MenuItem, id: string) {
  return new Promise((resolve, reject) => {
    axios
      .put(`/sys/menu/update/${id}`, data)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 删除菜单
 * @param id 菜单ID
 * @returns Promise，包含删除结果
 */
export function deleteMenu(id: string) {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/sys/menu/delete/${id}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
