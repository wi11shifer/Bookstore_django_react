import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../Contexts/AppContext';
import axios from 'axios';
import { List } from 'antd';
import styles from './OrderList.module.css';

const OrderList = () => {
    const { user, isLoggedIn } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn || !user) {
            navigate('/');
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/orders/', {
                    params: { user_id: user.user_id },
                });
                console.log('Orders API Response:', response.data);
                setOrders(response.data || []);
            } catch (error) {
                console.error('Orders Error:', error.response?.data || error.message);
                setOrders([]);
            }
        };

        const fetchUserInfo = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/users/', {
                    params: { user_id: user.user_id },
                });
                console.log('UserInfo API Response:', response.data);

                const foundUser = response.data.find(u => u.user_id === user.user_id);
                setUserInfo(foundUser || null);

            } catch (error) {
                console.error('UserInfo Error:', error.response?.data || error.message);
                setUserInfo(null);
            }
        };


        fetchOrders();
        fetchUserInfo();
    }, [user, isLoggedIn, navigate]);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>My orders</h2>
            {orders.length > 0 ? (
                <List
                    bordered
                    dataSource={orders}
                    renderItem={(order) => (
                        <List.Item>
                            <div className='OrderListStyle'>
                                <h3>Order: {order.order_id}</h3>
                                <p>Date: {order.order_date}</p>
                                <p>Total amount: {order.total_amount}₴</p>
                                {userInfo && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>Order user's info: </h4>
                                        <p>Name: {userInfo?.first_name} {userInfo?.last_name}</p>
                                        <p>Address: {userInfo?.address}</p>
                                    </div>
                                )}
                                <h4>Books:</h4>
                                <ul>
                                    {order.order_items && order.order_items.length > 0 ? (
                                        order.order_items.map((item) => (
                                            <li key={item.order_item_id} style={{ marginBottom: '10px' }}>
                                                <h3>Book name: {item.book?.title}</h3>
                                                <p>Author: {item.book?.author?.first_name} {item.book?.author?.last_name}</p>
                                                <p>Price: {item.book?.price}₴</p>
                                                <p>Genre: {item.book?.genre?.genre_name}</p>
                                                <p>Publisher: {item.book?.publisher?.publisher_name}</p>
                                                <p>Quantity: {item.quantity}</p>


                                            </li>
                                        ))
                                    ) : (
                                        <li>There are no books.</li>
                                    )}
                                </ul>
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <p>You don't have any orders yet.</p>
            )}
        </div>
    );
};

export default OrderList;
