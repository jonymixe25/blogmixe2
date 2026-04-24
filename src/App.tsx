/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Publish from './pages/Publish';

export default function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/publish" element={<Publish />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}
