import myAxios from 'axios';

const axios = myAxios.create({
  baseURL: 'http://dev.myapp.com:9090/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
// 添加请求拦截器，将token放入header中
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['token'] = `${token}`;
  }
  return config;
});
// 添加响应拦截器，如果响应码为401，则跳转到登录页面
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
