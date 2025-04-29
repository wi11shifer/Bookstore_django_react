import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../Contexts/AppContext';
import { List, Input, Button, Form, message, DatePicker } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const AdminPage = () => {
  const { user } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [userOrders, setUserOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [totalSpending, setTotalSpending] = useState(null);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/');
      setUsers(response.data);
      setEditedUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserOrders = async (user_id) => {
    try {
      const response = await axios.get('http://localhost:8000/api/orders/', {
        params: { user_id },
      });
      setUserOrders(response.data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setUserOrders([]);
    }
  };

  const fetchUserSpending = async (user_id, startDate, endDate) => {
    try {
      const response = await axios.get('http://localhost:8000/api/calculate-spending/', {
        params: {
          user_id,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setTotalSpending(response.data.total_spent);
    } catch (error) {
      console.error('Error fetching user spending:', error);
      setTotalSpending(null);
    }
  };

  const handleViewOrders = (user_id) => {
    fetchUserOrders(user_id);
    setSelectedUserId(user_id);
    setTotalSpending(null);
  };

  const handleFetchSpending = () => {
    if (selectedUserId && dateRange.length === 2) {
      const [start, end] = dateRange;
      const formattedStart = dayjs(start).format('YYYY-MM-DD');
      const formattedEnd = dayjs(end).format('YYYY-MM-DD');
      fetchUserSpending(selectedUserId, formattedStart, formattedEnd);
    } else {
      message.error('Please select both start and end dates.');
    }
  };

  const handleInputChange = (userId, field, value) => {
    setEditedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === userId ? { ...user, [field]: value } : user
      )
    );
  };

  const saveChanges = async () => {
    for (const editedUser of editedUsers) {
      try {
        await axios.put(`http://localhost:8000/api/users/${editedUser.user_id}/`, {
          first_name: editedUser.first_name,
          last_name: editedUser.last_name,
          email: editedUser.email,
          phone: editedUser.phone,
          address: editedUser.address,
        });
      } catch (error) {
        console.error(`Error updating user ${editedUser.user_id}:`, error);
      }
    }
    message.success('Users updated successfully!');
    fetchUsers();
  };

  const handleDeleteUser = async (user_id) => {
    try {
      await axios.delete(`http://localhost:8000/api/users/${user_id}/`);
      setEditedUsers(editedUsers.filter((user) => user.user_id !== user_id));
      message.success('User deleted!');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async () => {
    const { first_name, last_name, email, phone, address, password } = newUser;
    if (first_name && last_name && email && password) {
      try {
        await axios.post('http://localhost:8000/api/users/', {
          first_name,
          last_name,
          email,
          phone,
          address,
          password,
        });
        message.success('New user added!');
        setNewUser({ first_name: '', last_name: '', email: '', phone: '', address: '', password: '' });
        fetchUsers();
      } catch (error) {
        console.error('Error adding user:', error);
      }
    } else {
      message.error('Please fill all required fields!');
    }
  };

  if (!user?.is_admin) {
    return <p>Access denied: admins only</p>;
  }

  return (
    <div className="admin-page-container">
      <h1>Admin Dashboard</h1>
      <List
        bordered
        dataSource={editedUsers}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="primary" onClick={() => handleViewOrders(item.user_id)}>
                View Orders
              </Button>,
              <Button type="danger" onClick={() => handleDeleteUser(item.user_id)}>
                Delete
              </Button>,
            ]}
          >
            <Input
              placeholder="First Name"
              value={item.first_name}
              onChange={(e) => handleInputChange(item.user_id, 'first_name', e.target.value)}
              style={{ width: '120px', marginRight: '10px' }}
            />
            <Input
              placeholder="Last Name"
              value={item.last_name}
              onChange={(e) => handleInputChange(item.user_id, 'last_name', e.target.value)}
              style={{ width: '120px', marginRight: '10px' }}
            />
            <Input
              placeholder="Email"
              value={item.email}
              onChange={(e) => handleInputChange(item.user_id, 'email', e.target.value)}
              style={{ width: '200px', marginRight: '10px' }}
            />
            <Input
              placeholder="Phone"
              value={item.phone}
              onChange={(e) => handleInputChange(item.user_id, 'phone', e.target.value)}
              style={{ width: '140px', marginRight: '10px' }}
            />
            <Input
              placeholder="Address"
              value={item.address}
              onChange={(e) => handleInputChange(item.user_id, 'address', e.target.value)}
              style={{ width: '200px' }}
            />
          </List.Item>
        )}
      />
      <Button type="primary" onClick={saveChanges} style={{ marginTop: '20px' }}>
        Save Changes
      </Button>

      {selectedUserId && (
        <div style={{ marginTop: '30px' }}>
          <h2>Orders for User ID: {selectedUserId}</h2>
          {userOrders.length > 0 ? (
            <List
              bordered
              dataSource={userOrders}
              renderItem={(order) => (
                <List.Item>
                  <div>
                    <strong>Order ID:</strong> {order.order_id} | <strong>Date:</strong> {order.order_date} | <strong>Total amount:</strong> {order.total_amount}₴
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <p>No orders found.</p>
          )}

          <h3 style={{ marginTop: '30px' }}>Calculate User Spending</h3>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            style={{ marginRight: '10px' }}
          />
          <Button type="primary" onClick={handleFetchSpending}>
            Calculate Spending
          </Button>

          {totalSpending !== null && (
            <div style={{ marginTop: '20px' }}>
              <h3>Total Spent: {totalSpending}₴</h3>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: '30px' }}>Add New User</h2>
      <Form layout="inline">
        <Form.Item>
          <Input
            placeholder="First Name"
            value={newUser.first_name}
            onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
          />
        </Form.Item>
        <Form.Item>
          <Input
            placeholder="Last Name"
            value={newUser.last_name}
            onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
          />
        </Form.Item>
        <Form.Item>
          <Input
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            type="email"
          />
        </Form.Item>
        <Form.Item>
          <Input
            placeholder="Phone"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
          />
        </Form.Item>
        <Form.Item>
          <Input
            placeholder="Address"
            value={newUser.address}
            onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
          />
        </Form.Item>
        <Form.Item>
          <Input
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            type="password"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleAddUser}>
            Add User
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdminPage;