import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/books/?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching genre products:', err);
        setLoading(false);
      });
  }, [category]);

  const filteredProducts = products.filter(
    (product) => product.genre?.genre_name.toLowerCase() === category.toLowerCase()
  );


  console.log("Products from context:", products);

  return (
    <div>

      <h2>Genre: {category}</h2>
      {loading ? (
        <Spin />
      ) : filteredProducts.length > 0 ? (
        <ul>
          {filteredProducts.map((product) => (
            <li key={product.bookid}>
              <h3>{product.title}</h3>
              <p>
                Author:{' '}
                {product.author
                  ? `${product.author.first_name} ${product.author.last_name}`
                  : 'Unknown'}
              </p>
              <p>Price: {product.price}₴</p>
              <Button type="default" onClick={() => navigate(`/book/${product.book_id}`)} style={{ marginRight: '10px' }}>
                View Details
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found in this genre.</p>
      )}
    </div>
  );
}

export default CategoryPage;
