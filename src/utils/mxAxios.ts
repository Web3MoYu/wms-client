import myAxios from 'axios';

const axios = myAxios.create({
  baseURL: 'http://dev.myapp.com:9090/api',
});
// 添加请求拦截器，将token放入header中
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['token'] = `${token}`;
  }
  return config;
});
// 添加响应拦截器，如果响应码为401，则跳转到登录页面
axios.interceptors.response.use(
  (response) => {
    if (response.data.code === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('menu');
      window.location.href = '/login';
    }
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('menu');  
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
