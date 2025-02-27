import axios from '../../utils/mxAxios';

/**
 * 角色信息接口
 */
export interface Role {
  roleId: string;
  roleName: string;
  remark: string;
}

/**
 * 用户角色权限数据接口
 */
export interface UserRoleVo {
  menuId: string;
  parentId: string;
  permissions: string[];
}

/**
 * 根据角色ID获取角色信息
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
 * 获取所有角色列表
 * @returns Promise，包含所有角色列表
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
 * 分页查询角色列表
 * @param page 页码
 * @param pageSize 每页条数
 * @param roleName 角色名称（可选筛选条件）
 * @returns Promise，包含分页角色数据
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
 * 添加新角色
 * @param role 角色信息对象
 * @returns Promise，包含添加结果
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
 * 更新角色信息
 * @param role 角色信息对象
 * @param roleId 角色ID
 * @returns Promise，包含更新结果
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
 * @param roleId 角色ID
 * @returns Promise，包含删除结果
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
 * 分配角色权限
 * @param roleId 角色ID
 * @param permissions 权限信息数组
 * @returns Promise，包含权限分配结果
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
