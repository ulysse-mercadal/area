import React, { useEffect, useState } from 'react';
import { Layout, Header, Button, Input } from '../../Components';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '', role: 'USER' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur récupération users');
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Erreur récupération users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdd = () => {
    setForm({ name: '', surname: '', email: '', password: '', role: 'USER' });
    setIsAddOpen(true);
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setForm({ name: user.name || '', surname: user.surname || '', email: user.email || '', password: '', role: user.role || 'USER' });
    setIsEditOpen(true);
  };

  const createUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, surname: form.surname, email: form.email, password: form.password, role: form.role }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Erreur création utilisateur');
      }
      const created = await res.json();
      setUsers((prev) => [created, ...prev]);
      setIsAddOpen(false);
    } catch (err) {
      console.error('Erreur création utilisateur:', err);
      alert(String(err));
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, surname: form.surname, email: form.email, role: form.role }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Erreur mise à jour utilisateur');
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setIsEditOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Erreur mise à jour utilisateur:', err);
      alert(String(err));
    }
  };

  const deleteUser = async (user: any) => {
    if (!confirm(`Delete user ${user.email}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/user/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Erreur suppression utilisateur');
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err);
      alert(String(err));
    }
  };

  return (
    <Layout>
      <Header
        title="Admin — Users"
        description="Manage application users"
        actions={[{ label: 'Add User', icon: 'add', onClick: openAdd }]}
      />

      <div className="p-6">
        {loading ? (
          <div>Loading users...</div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {users.map((u: any) => (
              <div key={u.id} className="bg-white rounded-md shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{u.name} {u.surname} <span className="text-sm text-gray-500">({u.email})</span></div>
                  <div className="text-sm text-gray-600">Role: {u.role}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(u)}>Edit</Button>
                  <Button variant="danger" onClick={() => deleteUser(u)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsAddOpen(false); }}
            onClick={() => setIsAddOpen(false)}
          />
          <div role="dialog" aria-modal={isAddOpen} aria-hidden={!isAddOpen} className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create User</h3>
            <div className="space-y-3">
              <Input label="First name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Last name" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div>
                <label id="admin-add-role-label" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select aria-labelledby="admin-add-role-label" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={createUser}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditOpen(false); }}
            onClick={() => setIsEditOpen(false)}
          />
          <div role="dialog" aria-modal={isEditOpen} aria-hidden={!isEditOpen} className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-3">
              <Input label="First name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Last name" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <div>
                <label id="admin-edit-role-label" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select aria-labelledby="admin-edit-role-label" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={updateUser}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminUsers;
