import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/members', label: 'Members', icon: '👥' },
  { path: '/loans', label: 'Loan Approvals', icon: '💰' },
  { path: '/reports', label: 'Reports', icon: '📄' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const groupName = localStorage.getItem('sakhiGroupName') || 'My Group';
  const leaderName = localStorage.getItem('sakhiLeaderName') || 'Leader';

  function logout() {
    localStorage.removeItem('sakhiGroupId');
    localStorage.removeItem('sakhiGroupName');
    localStorage.removeItem('sakhiLeaderName');
    navigate('/login');
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl mb-1">🌸 Sakhi</div>
        <div className="text-sm text-slate-300 font-medium truncate">{groupName}</div>
        <div className="text-xs text-slate-500 mt-1">Leader: {leaderName}</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full text-left text-sm text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
