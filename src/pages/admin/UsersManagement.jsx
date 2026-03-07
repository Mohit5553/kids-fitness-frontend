import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);

  const load = () => {
    api.get('/users').then((res) => setUsers(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    await api.put(`/users/${id}/role`, { role });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12">
        <h1 className="font-display text-3xl">Users Management</h1>
        <p className="mt-2 text-sm text-ink/70">Manage parents, admins, and roles.</p>

        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div key={user._id} className="rounded-2xl bg-white/80 p-4 shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-ink/70">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="rounded-xl border border-orange-200/70 p-2 text-xs"
                    value={user.role}
                    onChange={(event) => updateRole(user._id, event.target.value)}
                  >
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold"
                    onClick={() => handleDelete(user._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

