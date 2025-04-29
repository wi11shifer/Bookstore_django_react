import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../Contexts/AppContext';
import styles from './ProductDetail.module.css';
import axios from 'axios';

export default function ProductDetail() {
  const { products } = useContext(AppContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const foundProduct = products?.find(p => p.id === parseInt(id, 10));
    if (foundProduct) {
      setProduct(foundProduct);
      setLoading(false);
    } else {
      axios
        .get(`http://localhost:8000/api/books/${id}/`)
        .then(response => {
          setProduct(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching product by ID:', error);
          setError('Failed to load product');
          setLoading(false);
        });
    }
  }, [id, products]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className={styles.productDetail}>
      <h1>{product.title}</h1>
      <h2>
        Author:{' '} <a
          onClick={() =>
            navigate(`/author/${product.author?.first_name} ${product.author?.last_name}`)
          }
          style={{ cursor: 'pointer' }}
        >
          {product.author?.first_name} {product.author?.last_name}
        </a>
      </h2>
      <h3>
        Genre:{' '}
        <a
          onClick={() => navigate(`/category/${product.genre?.genre_name}`)}
          style={{ cursor: 'pointer' }}
        >
          {product.genre?.genre_name}
        </a>
      </h3>
      <h3><p>Publication date: {product.publication_date}</p></h3>
      <h3><p>Publisher:  <a onClick={() => navigate(`/publisher/${product.publisher?.publisher_name}`)} style={{ cursor: 'pointer' }}>{product.publisher?.publisher_name}</a></p></h3>
      <img
        src={product.cover}
        alt={`${product.title} cover`}
        className={styles.bookCover}
        style={{ width: '200px', height: 'auto', marginBottom: '20px' }}
      />
      <h3>
        Price: {product.price}₴
      </h3>
      <button onClick={handleBack}>Back to Home</button>
    </div>
  );
}