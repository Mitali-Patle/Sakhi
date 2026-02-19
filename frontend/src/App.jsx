import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import LoanApprovals from './pages/LoanApprovals';
import Reports from './pages/Reports';
import GroupForm from './components/GroupForm';

function PrivateRoute({ children }) {
  const groupId = localStorage.getItem('sakhiGroupId');
  return groupId ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<GroupForm />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/members/:id" element={<PrivateRoute><MemberDetail /></PrivateRoute>} />
        <Route path="/loans" element={<PrivateRoute><LoanApprovals /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
