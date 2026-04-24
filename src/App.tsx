/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Navigation from './components/Navigation';

export default function App() {
  return (
    <AppProvider>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/publish" element={<Publish />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </AppProvider>
  );
}
