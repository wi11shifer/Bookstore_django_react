import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../Contexts/AppContext';
import { Form, Input, Button, DatePicker, message, Select, Radio } from 'antd';
import axios from 'axios';

const { Option } = Select;

const AddBook = () => {
  const { user } = useContext(AppContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [authorMode, setAuthorMode] = useState('select');
  const [publisherMode, setPublisherMode] = useState('select');
  const [genreMode, setGenreMode] = useState('select');

  useEffect(() => {
    axios.get('http://localhost:8000/api/genres/')
      .then(res => setGenres(res.data))
      .catch(err => {
        console.error('Failed to load genres:', err);
        message.error('Failed to load genres');
      });

    axios.get('http://localhost:8000/api/authors/')
      .then(res => setAuthors(res.data))
      .catch(err => {
        console.error('Failed to load authors:', err);
        message.error('Failed to load authors');
      });

    axios.get('http://localhost:8000/api/publishers/')
      .then(res => setPublishers(res.data))
      .catch(err => {
        console.error('Failed to load publishers:', err);
        message.error('Failed to load publishers');
      });
  }, []);

  useEffect(() => {
    if (authorMode === 'select') {
      form.setFieldsValue({
        author: { first_name: undefined, last_name: undefined, birthdate: undefined },
      });
    } else {
      form.setFieldsValue({ author_id: undefined });
    }
  }, [authorMode, form]);

  useEffect(() => {
    if (publisherMode === 'select') {
      form.setFieldsValue({
        publisher: { publisher_name: undefined, address: undefined, phone: undefined, email: undefined },
      });
    } else {
      form.setFieldsValue({ publisher_id: undefined });
    }
  }, [publisherMode, form]);

  useEffect(() => {
    if (genreMode === 'select') {
      form.setFieldsValue({ genre: { genre_name: undefined } });
    } else {
      form.setFieldsValue({ genre_id: undefined });
    }
  }, [genreMode, form]);

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    console.log('Form values:', values);

    formData.append('title', values.title || '');
    formData.append('price', values.price || '');
    formData.append(
      'publication_date',
      values.publication_date ? values.publication_date.format('YYYY-MM-DD') : ''
    );

    if (genreMode === 'select' && values.genre_id) {
      formData.append('genre_id', values.genre_id);
    } else if (genreMode === 'create' && values.genre?.genre_name) {
      formData.append('genre.genre_name', values.genre.genre_name);
    }

    if (authorMode === 'select' && values.author_id) {
      formData.append('author_id', values.author_id);
    } else if (authorMode === 'create' && values.author?.first_name && values.author?.last_name) {
      formData.append('author.first_name', values.author.first_name);
      formData.append('author.last_name', values.author.last_name);
      if (values.author.birthdate) {
        formData.append('author.birthdate', values.author.birthdate.format('YYYY-MM-DD'));
      }
    }

    if (publisherMode === 'select' && values.publisher_id) {
      formData.append('publisher_id', values.publisher_id);
    } else if (publisherMode === 'create' && values.publisher?.publisher_name) {
      formData.append('publisher.publisher_name', values.publisher.publisher_name);
      if (values.publisher.address) {
        formData.append('publisher.address', values.publisher.address);
      }
      if (values.publisher.phone) {
        formData.append('publisher.phone', values.publisher.phone);
      }
      if (values.publisher.email) {
        formData.append('publisher.email', values.publisher.email);
      }
    }

    if (values.cover && values.cover[0]) {
      formData.append('cover', values.cover[0].originFileObj);
    }

    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      await axios.post('http://localhost:8000/api/books/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('Book added successfully!');
      form.resetFields();
      setCoverPreview(null);
      setAuthorMode('select');
      setPublisherMode('select');
      setGenreMode('select');
    } catch (error) {
      console.error('Error adding book:', error.response?.data || error);
      message.error('Failed to add book: ' + (error.response?.data?.non_field_errors?.[0] || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return <p>Access denied: admins only</p>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Add New Book</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="title"
          label="Book Title"
          rules={[{ required: true, message: 'Please enter the book title' }]}
        >
          <Input placeholder="Enter book title" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price (₴)"
          rules={[{ required: true, message: 'Please enter the price' }]}
        >
          <Input type="number" placeholder="Enter price" />
        </Form.Item>

        <Form.Item
          name="publication_date"
          label="Publication Date"
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item label="Genre">
          <Radio.Group
            value={genreMode}
            onChange={e => setGenreMode(e.target.value)}
            style={{ marginBottom: '10px' }}
          >
            <Radio value="select">Select existing genre</Radio>
            <Radio value="create">Create new genre</Radio>
          </Radio.Group>

          {genreMode === 'select' ? (
            <Form.Item
              name="genre_id"
              rules={[{ required: true, message: 'Please select a genre' }]}
            >
              <Select placeholder="Select genre">
                {genres.map(genre => (
                  <Option key={genre.genre_id} value={genre.genre_id}>
                    {genre.genre_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item
              name={['genre', 'genre_name']}
              rules={[{ required: true, message: 'Please enter genre name' }]}
            >
              <Input placeholder="Genre Name" />
            </Form.Item>
          )}
        </Form.Item>

        <Form.Item label="Author">
          <Radio.Group
            value={authorMode}
            onChange={e => setAuthorMode(e.target.value)}
            style={{ marginBottom: '10px' }}
          >
            <Radio value="select">Select existing author</Radio>
            <Radio value="create">Create new author</Radio>
          </Radio.Group>

          {authorMode === 'select' ? (
            <Form.Item
              name="author_id"
              rules={[{ required: true, message: 'Please select an author' }]}
            >
              <Select placeholder="Select author">
                {authors.map(author => (
                  <Option key={author.author_id} value={author.author_id}>
                    {author.first_name} {author.last_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name={['author', 'first_name']}
                rules={[{ required: true, message: 'Please enter first name' }]}
                style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginRight: '16px' }}
              >
                <Input placeholder="First Name" />
              </Form.Item>
              <Form.Item
                name={['author', 'last_name']}
                rules={[{ required: true, message: 'Please enter last name' }]}
                style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
              >
                <Input placeholder="Last Name" />
              </Form.Item>
              <Form.Item
                name={['author', 'birthdate']}
                style={{ marginTop: '8px' }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Birthdate" />
              </Form.Item>
            </>
          )}
        </Form.Item>

        <Form.Item label="Publisher">
          <Radio.Group
            value={publisherMode}
            onChange={e => setPublisherMode(e.target.value)}
            style={{ marginBottom: '10px' }}
          >
            <Radio value="select">Select existing publisher</Radio>
            <Radio value="create">Create a new publisher</Radio>
          </Radio.Group>

          {publisherMode === 'select' ? (
            <Form.Item
              name="publisher_id"
              rules={[{ required: true, message: 'Please select a publisher' }]}
            >
              <Select placeholder="Select publisher">
                {publishers.map(publisher => (
                  <Option key={publisher.publisher_id} value={publisher.publisher_id}>
                    {publisher.publisher_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name={['publisher', 'publisher_name']}
                rules={[{ required: true, message: 'Please enter publisher name' }]}
              >
                <Input placeholder="Publisher name" />
              </Form.Item>
              <Form.Item
                name={['publisher', 'address']}
              >
                <Input placeholder="Address" />
              </Form.Item>
              <Form.Item
                name={['publisher', 'phone']}
              >
                <Input placeholder="Phone" />
              </Form.Item>
              <Form.Item
                name={['publisher', 'email']}
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </>
          )}
        </Form.Item>

        <Form.Item
          name="cover"
          label="Cover"
          rules={[{ required: true, message: 'Please upload a cover image' }]}
          valuePropName="fileList"
          getValueFromEvent={e => {
            if (Array.isArray(e)) {
              return e;
            }
            return e?.fileList;
          }}
        >
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const fileList = e.target.files;
              if (fileList.length > 0) {
                const file = fileList[0];
                form.setFieldsValue({
                  cover: [{
                    uid: '-1',
                    name: file.name,
                    status: 'done',
                    url: URL.createObjectURL(file),
                    originFileObj: file,
                  }],
                });
                setCoverPreview(URL.createObjectURL(file));
              }
            }}
          />
        </Form.Item>

        {coverPreview && (
          <img
            src={coverPreview}
            alt="Cover preview"
            style={{ width: '100px', marginBottom: '10px' }}
          />
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Book
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddBook;