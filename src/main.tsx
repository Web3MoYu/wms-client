import ReactDOM from 'react-dom/client';
// 使用mobx
import store from './store';
import { Provider } from 'mobx-react';
import Index from './pages/App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider {...store}>
    <Index />
  </Provider>
);
