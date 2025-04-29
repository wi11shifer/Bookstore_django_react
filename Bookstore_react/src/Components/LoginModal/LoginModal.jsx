import React, { useState, useContext } from 'react';
import { AppContext } from '../../Contexts/AppContext';
import { Input, Button, Checkbox, message } from 'antd';

function LoginModal({ isOpen, closeModal }) {
  const { loginUser } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(email, password, rememberMe)
      .then(() => {
        message.success('Success!');
        closeModal();
      })
      .catch((error) => {
        message.error(error.message || 'Wrong email or password');
      });
  };

  return isOpen ? (
    <div className="login-modal">
      <form onSubmit={handleSubmit}>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Checkbox
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        >
          Remember me
        </Checkbox>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Button type="primary" htmlType="submit">
            Login
          </Button>
          <Button type="default" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  ) : null;
}

export default LoginModal;