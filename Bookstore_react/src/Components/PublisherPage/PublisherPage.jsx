import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';

function PublisherPage() {
  const { publisher } = useParams();
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
        console.error('Error fetching books by publisher:', err);
        setLoading(false);
      });
  }, [publisher]);

  const filteredProducts = products.filter((product) => {
    const publisherName = product.publisher?.publisher_name?.toLowerCase() || '';
    return publisherName === publisher.toLowerCase();
  });

  const publisherDetails = filteredProducts.length > 0 ? filteredProducts[0].publisher : null;

  return (
    <div>
      <h2>Publisher: {publisher}</h2>
      <h3>Address: {publisherDetails?.address || 'Unknown'}</h3>
      <h3>Phone: {publisherDetails?.phone || 'Unknown'}</h3>
      <h3>Email: {publisherDetails?.email || 'Unknown'}</h3>

      {loading ? (
        <Spin />
      ) : filteredProducts.length > 0 ? (
        <ul>
          {filteredProducts.map((product) => (
            <li key={product.book_id}>
              <h3>{product.title}</h3>
              <p>
                Publisher:{' '}
                {product.publisher
                  ? `${product.publisher.publisher_name}`
                  : 'Unknown'}
              </p>
              <p>Price: {product.price}₴</p>
              <Button
                type="default"
                onClick={() => navigate(`/book/${product.book_id}`)}
                style={{ marginRight: '10px' }}
              >
                View Details
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found from this publisher.</p>
      )}
    </div>
  );
}

export default PublisherPage;
