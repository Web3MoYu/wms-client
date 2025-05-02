// 用与创建路由(可以根据数据，生成动态的路由)

import { useRoutes } from 'react-router-dom';
import Login from '../pages/Login';
import Index from '../pages/Index';
// react动态加载组件 @loadable/component
import lodable from '@loadable/component';
import { observer } from 'mobx-react-lite';
import userStore from '../store/userStore';
import { JSX } from 'react/jsx-runtime';
import PersonalInfo from '../components/personal/PersonalInfo';
import NotFound from '../components/not-found/NotFound';

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

const myRouter = () => {
  const user = new userStore();
  const router = createRouter(user.menu);
  router.push({
    path: '/personal',
    element: <PersonalInfo />,
  });
  return router;
};

const PrivateRoute = observer(() => {
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
      children: [
        ...myRouter(),
        // 在子路由中添加404路由，这样可以在导航布局中显示404页面
        {
          path: '*',
          element: <NotFound />
        }
      ],
    },
    {
      path: '/personal',
      element: <PersonalInfo />,
    },
    {
      path: '/*',
      element: <NotFound />,
    },
  ]);
});

export default PrivateRoute;
