import React, { useState, useContext } from 'react';
import { AppContext } from '../../Contexts/AppContext';
import { Input, Button, message } from 'antd';

function RegistrationModal({ isOpen, closeModal }) {
  const { registerUser } = useContext(AppContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      message.error('Passwords aren\'t matching');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      message.error('Invalid email format');
      return;
    }

    registerUser(firstName, lastName, email, password, phone, address)
      .then(() => {
        message.success('Registration succesfully!');
        closeModal();
      })
      .catch((error) => {
        message.error(error.message || 'Registration error');
      });
  };

  return isOpen ? (
    <div className="login-modal">
      <form onSubmit={handleSubmit}>
        <Input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          placeholder="City"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input.Password
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="primary" htmlType="submit">
          Register
        </Button>
        <Button type="default" onClick={closeModal}>
          Cancel
        </Button>
      </form>
    </div>
  ) : null;
}

export default RegistrationModal;