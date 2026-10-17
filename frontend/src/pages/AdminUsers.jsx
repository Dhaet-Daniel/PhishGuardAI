import { useEffect, useState } from 'react';
import { getApi, postApi, putApi, deleteApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const fetchUsers = () => getApi('/admin/users').then(setUsers).catch(console.error);

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setEmail('');
    setPassword('');
    setRole('user');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editUser) {
        await putApi(`/admin/users/${editUser.id}`, { email, password: password || undefined, role });
        toast.success('User updated');
      } else {
        await postApi('/admin/users', { email, password, role });
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteApi(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Users</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Add User
        </button>
      </div>
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800/50">
                <td className="p-3">{u.id}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => openEdit(u)} className="text-blue-400 hover:text-blue-300">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#111827] p-6 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{editUser ? 'Edit User' : 'New User'}</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (leave blank to keep)"
                className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-700 rounded">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
