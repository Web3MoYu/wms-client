import { makeAutoObservable, runInAction } from 'mobx';
import {
  LoginDto,
  bindWechat,
  login,
  updateUserInfo,
} from '../api/auth-service/AuthController';

class userStore {
  // 可观察的属性, observable, computed, action
  constructor() {
    makeAutoObservable(this);
  }

  get user() {
    if (sessionStorage.getItem('user')) {
      return JSON.parse(sessionStorage.getItem('user') || '');
    }
    return {};
  }

  set user(data) {
    sessionStorage.setItem('user', JSON.stringify(data));
  }

  get token() {
    if (sessionStorage.getItem('token')) {
      return sessionStorage.getItem('token') || '';
    }
    return '';
  }
  set token(data) {
    sessionStorage.setItem('token', data);
  }

  get menu() {
    if (sessionStorage.getItem('menu')) {
      return JSON.parse(sessionStorage.getItem('menu') || '');
    }
    return {};
  }

  set menu(data) {
    sessionStorage.setItem('menu', JSON.stringify(data));
  }

  login = (user: LoginDto) => {
    // 只进行数据处理，不进行界面的提示信息
    return new Promise((resolve, reject) => {
      login(user)
        .then((data: any) => {
          if (data.code == 200) {
            this.user = data.data.user;
            this.token = data.data.token;
            this.menu = data.data.menuTree;
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  bindWechat = (
    params: { username: string; password: string },
    wxid: string
  ) => {
    return new Promise((resolve, reject) => {
      bindWechat(params, wxid)
        .then((data: any) => {
          if (data.code == 200) {
            this.user = data.data.user;
            this.token = data.data.token;
            this.menu = data.data.menuTree;
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // 获取用户名
  get username() {
    return this.user?.username || '未知用户';
  }

  set userInfo(data: { user: any; token: string; menu: any }) {
    this.user = data.user;
    this.token = data.token;
    this.menu = data.menu;
  }

  updateUserInfo = async (userInfo: any, uploaded: number) => {
    return new Promise((resolve, reject) => {
      updateUserInfo({ ...this.user, ...userInfo }, uploaded)
        .then((data: any) => {
          if (data.code == 200) {
            runInAction(() => {
              this.user = data.data; // 确保使用action更新
            });
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch(reject);
    });
  };
}

export default userStore;
