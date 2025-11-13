import React, { useState, useEffect, use } from 'react';
import { Layout, Header, Input, Button, Toggle } from '../../Components';
import { useAuth } from '../../Context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
}

export const Profile: React.FC = () => {
  const [firstName, setFirstName] = useState('Sarah');
  const [lastName, setLastName] = useState('Connor');
  const [email, setEmail] = useState('sarah.connor@example.com');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [user, setUser] = useState<User | null>(null);
  const token = localStorage.getItem("token");
  const { logout } = useAuth();

  async function fetchUserData() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      console.log("Token validation failed, status:", res.status);
      localStorage.removeItem("token");
      throw new Error("JWT is invalid");
    }
  }

  async function updateUserData(updatedData: User) {
    const res = await fetch(`${API_BASE_URL}/user/${user?.id}`, {
      method: "PATCH",
      headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: updatedData.email,
        name: updatedData.name,
        surname: updatedData.surname,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      console.log("Failed to update user data, status:", res.status);
      throw new Error("Failed to update user data");
    }
  }

  async function deleteUserAccount() {
    const res = await fetch(`${API_BASE_URL}/user/${user?.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (res.ok) {
      localStorage.removeItem("token");
      setUser(null);
    } else {
      console.log("Failed to delete user account, status:", res.status);
      throw new Error("Failed to delete user account");
    }
  }

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setFirstName(user?.name || '');
    setLastName(user?.surname || '');
    setEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    updateUserData({ id: user?.id || 0, email, name: firstName, surname: lastName });
  }, [email]);

  const handleSaveChanges = () => {
    updateUserData({ id: user?.id || 0, email, name: firstName, surname: lastName });
  };

  const sidebarItems = [
    { icon: 'add_road', label: 'My Workflows', href: '/workflows', active: false },
    { icon: 'key', label: 'Credentials', href: '/credentials', active: false },
    { icon: 'account_circle', label: 'Account', href: '/account', active: true },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Header
        title="Account Settings"
        description="Manage your profile, account settings, and preferences."
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-sora">Profile</h2>
            
            <div className="flex items-center gap-6 mb-6">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/2b76d725afff10fb788ac8fd4ebabd805dbb207d?width=192"
                alt="Profile"
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-sora">{user?.name}</h3>
                <p className="text-gray-600 font-sora">{user?.email}</p>
                <button className="text-[#7F22FE] text-sm font-sora mt-2 hover:underline">
                  Change picture
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-sora">Account Settings</h2>
            
            <div className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-sora">Logout</h2>
            <p className="text-gray-600 mb-6 font-sora">
              Click the button below to logout from your account.
            </p>
            <Button variant="danger" onClick={logout}>Logout</Button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-red-600 mb-4 font-sora">Delete Account</h2>
            <p className="text-gray-600 mb-6 font-sora">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger" onClick={deleteUserAccount}>Delete My Account</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
