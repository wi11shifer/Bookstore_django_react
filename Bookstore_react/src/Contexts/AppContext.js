import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext({
  isLoggedIn: false,
  user: null,
  registerUser: () => { },
  loginUser: () => { },
  logoutUser: () => { },
  products: [],
  setProducts: () => { },
});

export const AppProvider = ({ children, products }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [productsList, setProducts] = useState(products);

  useEffect(() => {
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
    if (rememberedUser) {
      setIsLoggedIn(true);
      setUser(rememberedUser);
    } else {
      checkAuth();
    }
  }, []);


  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/check-auth/');
      setUser(response.data.user);
      setIsLoggedIn(true);
      localStorage.setItem('rememberedUser', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('rememberedUser');
      return null;
    }
  };

  const registerUser = async (firstName, lastName, email, password, phone, address) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        address,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration error!');
    }
  };

  const loginUser = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/login/', {
        email,
        password,
        remember_me: rememberMe,
      });
      setUser(response.data.user);
      setIsLoggedIn(true);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error while logging');
    }
  };

  const logoutUser = async () => {
    try {
      await axios.post('http://localhost:8000/api/users/logout/');
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('rememberedUser');
    } catch (error) {
      console.error('Error while logging:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        registerUser,
        loginUser,
        logoutUser,
        products: productsList,
        setProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);