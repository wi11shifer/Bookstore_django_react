import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Button, Input, message } from 'antd';
import { removeItem, updateItemQuantity, clearCart } from '../../redux/slices/itemsSlice';
import axios from 'axios';
import { useAppContext } from '../../Contexts/AppContext';

const CartModal = ({ isOpen, closeModal, isDarkTheme }) => {
  const dispatch = useDispatch();
  const selectedProducts = useSelector((state) => state.items.selectedItems || []);
  const [quantities, setQuantities] = React.useState({});
  const [orderSuccess, setOrderSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { user, isLoggedIn } = useAppContext();

  React.useEffect(() => {
    const newQuantities = { ...quantities };
    selectedProducts.forEach((product) => {
      if (!(product.id in newQuantities)) {
        newQuantities[product.id] = 1;
      }
    });
    setQuantities(newQuantities);
  }, [selectedProducts]);

  const handleRemove = (id) => {
    dispatch(removeItem(id));
    setQuantities((prevQuantities) => {
      const updatedQuantities = { ...prevQuantities };
      delete updatedQuantities[id];
      return updatedQuantities;
    });
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity >= 1) {
      setQuantities({ ...quantities, [id]: newQuantity });
      dispatch(updateItemQuantity({ id, quantity: newQuantity }));
    }
  };

  const totalAmount = selectedProducts.reduce((total, product) => {
    return total + product.priceUAH * (quantities[product.id] || 1);
  }, 0);

  const handleOrderSuccess = async () => {
    setLoading(true);
    try {
      if (!isLoggedIn || !user) {
        message.error('You must be logged in to place an order.');
        setLoading(false);
        return;
      }

      const orderData = {
        user_id: user.user_id,
        order_date: new Date().toISOString().split('T')[0],
        order_items: selectedProducts.map((product) => ({
          book_id: product.id,
          quantity: quantities[product.id] || 1,
        })),
      };

      const response = await axios.post('http://localhost:8000/api/orders/', orderData);

      if (response.status === 201) {
        setOrderSuccess(true);
        message.success('Order placed successfully!');
        dispatch(clearCart());
        setQuantities({});
      }
    } catch (error) {
      console.error('Error while placing order:', error.response?.data || error.message);
      message.error('Error while placing order. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Your Cart"
      open={isOpen}
      onCancel={closeModal}
      footer={null}
      className={isDarkTheme ? 'cart-modal dark-theme' : 'cart-modal'}
    >
      {selectedProducts.length > 0 ? (
        <>
          {selectedProducts.map((product) => (
            <div key={product.id} style={{ marginBottom: '20px' }}>
              <h4>{product.name} by {product.author}</h4>
              <p>Price for unit: {product.priceUAH}₴</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  type="number"
                  value={quantities[product.id] || 1}
                  onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}
                  min="1"
                  style={{ width: '60px', marginRight: '10px' }}
                />
                <Button
                  size="small"
                  danger
                  onClick={() => handleRemove(product.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <h3>Total amount: {totalAmount}₴</h3>

          <div>
            <Button
              type="primary"
              onClick={handleOrderSuccess}
              loading={loading}
              disabled={loading}
            >
              Proceed to order
            </Button>
          </div>
          {/* {orderSuccess && <div style={{ marginTop: '10px', color: 'green' }}>Order placed successfully!</div>} */}
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </Modal>
  );
};

export default CartModal;