import axios from '../../utils/mxAxios';

export interface Role {
  roleId: string;
  roleName: string;
  remark: string;
}

export interface UserRoleVo {
  menuId: string;
  parentId: string;
  permissions: string[];
}

/**
 * 获取角色列表
 * @param roleId 角色id
 * @returns
 */
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

/**
 * 分页查询角色
 * @param page 页码
 * @param pageSize 每页条数
 * @param roleName 角色名称
 * @returns
 */
export function pageSearch(page: number, pageSize: number, roleName: string) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/sys/role/page`, { params: { page, pageSize, roleName } })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 添加角色
 * @param role 角色
 * @returns
 */
export function addRole(role: Role) {
  return new Promise((resolve, reject) => {
    axios
      .post('/sys/role/add', role)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 更新角色
 * @param role 角色
 * @returns
 */
export function updateRole(role: Role, roleId: string) {
  return new Promise((resolve, reject) => {
    axios
      .put(`/sys/role/update/${roleId}`, role)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 删除角色
 * @param roleId 角色id
 * @returns
 */
export function deleteRole(roleId: string) {
  return new Promise((resolve, reject) => {
    axios
      .delete(`/sys/role/delete/${roleId}`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 *  分配角色权限信息
 * @param roleId 角色id
 * @param permissions 权限信息
 * @returns
 */
export function assignRolePermission(
  roleId: string,
  permissions: UserRoleVo[]
) {
  return new Promise((resolve, reject) => {
    axios
      .put(`/sys/role/updatePermissions/${roleId}`, permissions)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
