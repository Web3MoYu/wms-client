import { BrowserRouter as Router } from 'react-router-dom';
import MyRouter from '../component/MyRouter.tsx';

export default function App() {
  return (
    <Router>
      <MyRouter />
    </Router>
  );
}
