// import './App.css';
import VideoChat from './pages/VideoChat/VideoChat';
import {Outlet} from "react-router-dom"

function App() {
  return (
    <div className="App">
      <Outlet/>
    </div>
  );
}

export default App;
