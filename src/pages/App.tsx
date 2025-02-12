import { BrowserRouter as Router } from 'react-router-dom';
import MyRouter from '../components/MyRouter.tsx';

export default function App() {
  return (
    <Router>
      <MyRouter />
    </Router>
  );
}
