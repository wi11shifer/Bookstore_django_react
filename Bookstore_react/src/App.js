import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Dropdown, Menu, Switch, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import "./styles.css";
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import ProductList from './Components/ProductList/ProductList';
import LoginModal from './Components/LoginModal/LoginModal';
import CategoryPage from "./Components/CategoryPage/CategoryPage";
import { useStatus } from './hooks/useStatus';
import { OrderProvider } from './Contexts/OrderContext';
import ProductDetail from './Components/ProductDetail/ProductDetail';
import AdminPage from './Components/AdminPage/AdminPage';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, removeItem } from './redux/slices/itemsSlice';
import { AppProvider, AppContext } from './Contexts/AppContext';
import EditBook from "./Components/EditBook/EditBook";
import AddBook from "./Components/AddBook/AddBook";
import AuthorPage from "./Components/AuthorPage/AuthorPage";
import PublisherPage from "./Components/PublisherPage/PublisherPage";
import OrderList from "./Components/OrderList/OrderList"

export default function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedProducts = useSelector((state) => state.items.selectedItems || []);
  const { status: isModalOpen, toggleStatus: toggleModal } = useStatus();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const handleProductSelect = (product, isSelected) => {
    if (isSelected) {
      dispatch(addItem(product));
    } else {
      dispatch(removeItem(product.id));
    }
  };

  const toggleTheme = (checked) => {
    setIsDarkTheme(checked);
    document.body.classList.toggle('dark-theme', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  const handleLogin = (username) => {
    if (typeof username === 'string') {
      setIsLoggedIn(true);
      toggleModal();
    }
  };

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);
    const sortedProducts = [...products].sort((a, b) => {
      if (criteria === 'price') return a.priceUAH - b.priceUAH;
      if (criteria === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    setProducts(sortedProducts);
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <Button type="primary" onClick={() => navigate('/admin')}>
          Admin Panel
        </Button>
      </Menu.Item>
      <Menu.Item key="2">
        <Button type="primary" onClick={() => navigate('/add')} style={{ marginBottom: '10px' }}>
          Add Book
        </Button>
      </Menu.Item>

    </Menu>
  );
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/books/");
        setProducts(response.data);
      } catch (error) {
        console.error("Error while loading books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <AppProvider products={products}>
      <OrderProvider>
        <div className={isDarkTheme ? "App dark-theme" : "App"}>
          <Header isDarkTheme={isDarkTheme} isLoggedIn={isLoggedIn} toggleLogin={toggleModal} />

          <div style={{ margin: '16px' }}>
            <Switch checked={isDarkTheme} onChange={toggleTheme} checkedChildren="Dark" unCheckedChildren="Light" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button type="primary">
                Technical actions <DownOutlined />
              </Button>
            </Dropdown>
          </div>

          <Routes>
            <Route path="/add" element={<AddBook />} />
            <Route path="/edit/:book_id" element={<EditBook />} />

            <Route path="/" element={

              <ProductList
                products={products}
                onProductSelect={handleProductSelect}
                selectedProducts={selectedProducts}
                onDeleteProduct={handleDeleteProduct}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortCriteria={sortCriteria}
                handleSortChange={handleSortChange}
              />
            } />

            <Route path="/book/:id" element={<ProductDetail />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/author/:author" element={<AuthorPage />} />
            <Route path="/publisher/:publisher" element={<PublisherPage />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <Footer />
          <LoginModal isOpen={isModalOpen} onClose={toggleModal} onLogin={handleLogin} />
        </div>
      </OrderProvider>
    </AppProvider>

  );
};