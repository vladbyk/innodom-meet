import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route} from "react-router-dom";
import './index.css';
import App from './App';
import VideoChat from './pages/VideoChat/VideoChat';
import Room from './pages/Room/Room';

export default function Routing() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App/>}>
            <Route index element={<VideoChat />} />
            {/* <Route path="room" element={<Room/>} /> */}
            {/* <Route path="*" element={<NoPage />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Routing />
);
