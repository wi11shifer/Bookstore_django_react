import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';

function AuthorPage() {
  const { author } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/books/`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching book author:', err);
        setLoading(false);
      });
  }, [author]);

  const filteredProducts = products.filter((product) => {
    const fullName = `${product.author?.first_name || ''} ${product.author?.last_name || ''}`.toLowerCase();
    return fullName === author.toLowerCase();
  });

  const authorDetails = filteredProducts.length > 0 ? filteredProducts[0].author : null;

  return (
    <div>
      <h2>Author: {author}</h2>
      <h3>Born in: {authorDetails && authorDetails.birthdate ? authorDetails.birthdate : 'Unknown'}</h3>
      {loading ? (
        <Spin />
      ) : filteredProducts.length > 0 ? (
        <ul>
          {filteredProducts.map((product) => (
            <li key={product.book_id}>
              <h3>{product.title}</h3>
              <p>
                Author:{' '}
                {product.author
                  ? `${product.author.first_name} ${product.author.last_name}`
                  : 'Unknown'}
              </p>
              <p>Price: {product.price}₴</p>
              <Button
                type="default"
                onClick={() => navigate(`/book/${product.book_id}`)}
                style={{ marginRight: '10px' }}
              >
                View details
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found by this author.</p>
      )}
    </div>
  );
}

export default AuthorPage;
