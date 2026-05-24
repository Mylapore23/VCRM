import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import PitchDocs from './pages/PitchDocs';
import ContentRepo from './pages/ContentRepo';
import KnowledgeRepo from './pages/KnowledgeRepo';
import Nav from './components/Nav';
import ApiKeyBanner from './components/ApiKeyBanner';

function Shell() {
  const { currentUser } = useApp();
  if (!currentUser) return <Login />;
  return (
    <>
      <Nav />
      <ApiKeyBanner />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/pitches" element={<PitchDocs />} />
        <Route path="/knowledge" element={<KnowledgeRepo />} />
        <Route path="/content" element={<ContentRepo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AppProvider>
  );
}
