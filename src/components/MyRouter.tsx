// 用与创建路由(可以根据数据，生成动态的路由)

import { Navigate, useRoutes } from 'react-router-dom';
import Login from '../pages/Login';
import Index from '../pages/Index';
// react动态加载组件 @loadable/component
import lodable from '@loadable/component';
import { observer } from 'mobx-react-lite';
import userStore from '../store/userStore';
import { JSX } from 'react/jsx-runtime';
import AuthCallback from '../pages/AuthCallback';

function createRouter(list: any) {
  const arr: { path: any; children?: any[]; element?: JSX.Element }[] = [];
  if (list && list.length > 0) {
    list.map((item: any) => {
      const children = item.children;
      item = item.menu;
      const Component = lodable(() => {
        return import('./' + item.componentPath);
      });
      if (children && children.length > 0) {
        arr.push({
          path: item.routePath,
          // element: <Component />,
          children: [...createRouter(children)],
        });
      } else {
        arr.push({
          path: item.routePath,
          element: <Component />,
        });
      }
    });
  }

  return arr;
}

const PrivateRoute = observer(() => {
  const user = new userStore();

  return useRoutes([
    {
      path: '/',
      element: <Login />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: <Index />,
      children: [...createRouter(user.menu)],
    },
    {
      path: '/*',
      element: <Navigate to={'/login'}></Navigate>,
    },
  ]);
});

export default PrivateRoute;
