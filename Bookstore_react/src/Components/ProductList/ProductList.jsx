import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Checkbox, Button, Select, Input } from 'antd';
import axios from 'axios';

const { Option } = Select;

function ProductList({ onProductSelect }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/books/')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to load books:', err));
  }, []);

  const filteredProducts = products.filter(product => {
    const name = product.title || '';
    const author = `${product.author?.first_name || ''} ${product.author?.last_name || ''}`;
    const category = product.genre_name || '';
    const price = parseFloat(product.price) || 0;

    const matchesSearchTerm = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriceRange =
      (minPrice === '' || price >= parseFloat(minPrice)) &&
      (maxPrice === '' || price <= parseFloat(maxPrice));

    return matchesSearchTerm && matchesPriceRange;
  });

  const handleProductSelect = (product, checked) => {
    const item = {
      id: product.book_id,
      name: product.title,
      author: `${product.author?.first_name || ''} ${product.author?.last_name || ''}`,
      priceUAH: product.price,
    };

    if (checked) {
      setSelectedProducts(prev => [...prev, item]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.book_id));
    }

    if (onProductSelect) {
      onProductSelect(item, checked);
    }
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortCriteria === 'title') return a.title.localeCompare(b.title);
    if (sortCriteria === 'price') return a.price - b.price;
    return 0;
  });

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Book list</h2>

      <div style={{ marginBottom: '20px' }}>
        <Input
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200, margin: '5px', marginRight: '10px', height: 32 }}
        />
        <Input.Group compact style={{ marginBottom: '10px' }}>
          <Input
            style={{ width: '120px', height: 32 }}
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            style={{ width: '120px', height: 32 }}
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </Input.Group>

        <div>
          <label htmlFor="sortSelect">Sort by: </label>
          <Select
            book_id="sortSelect"
            placeholder="Select an option"
            value={sortCriteria}
            onChange={setSortCriteria}
            style={{ width: 120, marginRight: '10px' }}
          >
            <Option value="title">Title</Option>
            <Option value="price">Price</Option>
          </Select>
        </div>
      </div>

      <TransitionGroup component="ul" style={{ listStyle: 'none', padding: 0 }}>
        {sortedProducts.map(product => (
          <CSSTransition key={product.book_id} timeout={300} classNames="product">
            <li style={{ marginBottom: '30px' }}>
              <div
                className={`product-item ${selectedProducts.some(p => p.book_id === product.book_id) ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  border: '1px solid #ddd',
                  padding: '20px',
                  borderRadius: '10px',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}
              >
                <img
                  src={product.cover}
                  alt={`${product.title} cover`}
                  style={{ width: '150px', height: 'auto' }}
                />

                <div style={{ textAlign: 'left' }}>
                  <h3>{product.title}</h3>
                  <p>
                    Author:{" "}
                    <a
                      onClick={() => navigate(`/author/${product.author?.first_name} ${product.author?.last_name}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {product.author?.first_name} {product.author?.last_name}
                    </a>
                  </p>


                  <p>Price: {product.price}₴</p>
                  <p>Genre: <a onClick={() => navigate(`/category/${product.genre?.genre_name}`)} style={{ cursor: 'pointer' }}>{product.genre?.genre_name}</a></p>
                  <p>Publisher:  <a onClick={() => navigate(`/publisher/${product.publisher?.publisher_name}`)} style={{ cursor: 'pointer' }}>{product.publisher?.publisher_name}</a></p>
                  <Checkbox
                    checked={selectedProducts.some(p => p.id === product.book_id)}
                    onChange={(e) => handleProductSelect(product, e.target.checked)}
                  >
                    Add to cart
                  </Checkbox>



                  <div style={{ marginTop: '10px' }}>


                    <Button type="default" onClick={() => navigate(`/book/${product.book_id}`)} style={{ marginRight: '10px' }}>
                      View Details
                    </Button>

                    <Button type="dashed" onClick={() => navigate(`/edit/${product.book_id}`)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}

export default ProductList;
