import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateBounty from './pages/CreateBounty';
import BountyDetail from './pages/BountyDetail';
import Profile from './pages/Profile';
import ArbitrationHall from './pages/ArbitrationHall';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBounty />} />
          <Route path="/bounty/:id" element={<BountyDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/arbitration" element={<ArbitrationHall />} />
        </Routes>
      </main>
      <footer className="border-t border-gray-100 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          <p>MathBounty - 去中心化数学解题悬赏平台</p>
          <p className="mt-1">Powered by Ethereum / Solidity / IPFS / The Graph</p>
        </div>
      </footer>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
      }} />
    </div>
  );
}
