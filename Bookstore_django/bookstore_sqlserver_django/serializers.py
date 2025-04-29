from rest_framework import serializers
from .models import *
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'first_name', 'last_name', 'email', 'phone', 'address', 'password', 'is_admin']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        user = User(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            address=validated_data.get('address', ''),
            is_admin=validated_data.get('is_admin', False),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['author_id', 'first_name', 'last_name', 'birthdate']

class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ['publisher_id', 'publisher_name', 'address', 'phone', 'email']

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['genre_id', 'genre_name']

class BookSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(required=False)
    publisher = PublisherSerializer(required=False)
    genre = GenreSerializer(required=False)
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), write_only=True, required=False
    )
    publisher_id = serializers.PrimaryKeyRelatedField(
        queryset=Publisher.objects.all(), write_only=True, required=False
    )
    genre_id = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(), write_only=True, required=False
    )
    cover_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Book
        fields = ['book_id', 'title', 'genre', 'publication_date', 'author', 'author_id', 'publisher', 'publisher_id', 'cover', 'cover_url', 'price', 'genre_id']

    def to_internal_value(self, data):
        nested_data = {}
        
        for key, value in data.items():
            if key.startswith('author.'):
                nested_data.setdefault('author', {})[key[7:]] = value
            elif key.startswith('publisher.'):
                nested_data.setdefault('publisher', {})[key[10:]] = value
            elif key.startswith('genre.'):
                nested_data.setdefault('genre', {})[key[6:]] = value
            else:
                nested_data[key] = value

        logger.info(f"Processed internal data: {nested_data}")

        return super().to_internal_value(nested_data)

    def validate(self, data):
        logger.info(f"Serializer data: {data}")

        has_author_id = 'author_id' in data and data['author_id'] is not None
        has_author = 'author' in data and data['author']
        if has_author_id == has_author:
            logger.error("Validation failed: Provide exactly one of 'author_id' or 'author' data.")
            raise serializers.ValidationError("Provide exactly one of 'author_id' or 'author' data.")

        has_publisher_id = 'publisher_id' in data and data['publisher_id'] is not None
        has_publisher = 'publisher' in data and data['publisher']
        if has_publisher_id == has_publisher:
            logger.error("Validation failed: Provide exactly one of 'publisher_id' or 'publisher' data.")
            raise serializers.ValidationError("Provide exactly one of 'publisher_id' or 'publisher' data.")

        has_genre_id = 'genre_id' in data and data['genre_id'] is not None
        has_genre = 'genre' in data and data['genre']
        if has_genre_id == has_genre:
            logger.error("Validation failed: Provide exactly one of 'genre_id' or 'genre' data.")
            raise serializers.ValidationError("Provide exactly one of 'genre_id' or 'genre' data.")

        return data

    def get_cover_url(self, obj):
        if obj.cover and hasattr(obj.cover, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.cover.url) if request else obj.cover.url
        return None

    def create(self, validated_data):
        author_data = validated_data.pop('author', None)
        publisher_data = validated_data.pop('publisher', None)
        genre_data = validated_data.pop('genre', None)
        author_id = validated_data.pop('author_id', None)
        publisher_id = validated_data.pop('publisher_id', None)
        genre_id = validated_data.pop('genre_id', None)
        cover_file = validated_data.pop('cover', None)

        if author_id:
            author = author_id
        elif author_data:
            author, _ = Author.objects.get_or_create(
                first_name=author_data['first_name'],
                last_name=author_data['last_name'],
                defaults={'birthdate': author_data.get('birthdate')}
            )

        if publisher_id:
            publisher = publisher_id
        elif publisher_data:
            publisher, _ = Publisher.objects.get_or_create(
                publisher_name=publisher_data['publisher_name'],
                defaults={
                    'address': publisher_data.get('address'),
                    'phone': publisher_data.get('phone'),
                    'email': publisher_data.get('email'),
                }
            )

        if genre_id:
            genre = genre_id
        elif genre_data:
            genre, _ = Genre.objects.get_or_create(genre_name=genre_data['genre_name'])

        book = Book.objects.create(
            author=author,
            publisher=publisher,
            genre=genre,
            cover=cover_file,
            **validated_data
        )

        return book

    def update(self, instance, validated_data):
        author_data = validated_data.pop('author', None)
        publisher_data = validated_data.pop('publisher', None)
        genre_data = validated_data.pop('genre', None)
        author_id = validated_data.pop('author_id', None)
        publisher_id = validated_data.pop('publisher_id', None)
        genre_id = validated_data.pop('genre_id', None)
        cover_file = validated_data.pop('cover', None)

        if author_id:
            instance.author = author_id
        elif author_data:
            instance.author.first_name = author_data.get('first_name', instance.author.first_name)
            instance.author.last_name = author_data.get('last_name', instance.author.last_name)
            instance.author.birthdate = author_data.get('birthdate', instance.author.birthdate)
            instance.author.save()

        if publisher_id:
            instance.publisher = publisher_id
        elif publisher_data:
            instance.publisher.publisher_name = publisher_data.get('publisher_name', instance.publisher.publisher_name)
            instance.publisher.address = publisher_data.get('address', instance.publisher.address)
            instance.publisher.phone = publisher_data.get('phone', instance.publisher.phone)
            instance.publisher.email = publisher_data.get('email', instance.publisher.email)
            instance.publisher.save()

        if genre_id:
            instance.genre = genre_id
        elif genre_data:
            genre, _ = Genre.objects.get_or_create(genre_name=genre_data['genre_name'])
            instance.genre = genre

        if cover_file is not None:
            instance.cover = cover_file

        instance.title = validated_data.get('title', instance.title)
        instance.publication_date = validated_data.get('publication_date', instance.publication_date)
        instance.price = validated_data.get('price', instance.price)

        instance.save()
        return instance
    

class OrderItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(), write_only=True
    )
    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(), required=False
    )

    class Meta:
        model = OrderItem
        fields = ['order_item_id', 'order', 'book', 'book_id', 'quantity']

    def validate(self, data):
        book = data['book_id']
        quantity = data['quantity']
        if quantity <= 0:
            raise serializers.ValidationError("Quantity must be more than 0.")
        return data
    
class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, required=True)
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = Order
        fields = ['order_id', 'user', 'user_id', 'order_date', 'total_amount', 'order_items']

    def validate(self, data):
        if not data.get('order_items'):
            raise serializers.ValidationError("Order must include at least 1 item.")
        return data

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        user = validated_data.pop('user_id')
        validated_data['user'] = user
        order = Order.objects.create(**validated_data)

        for order_item_data in order_items_data:
            book = order_item_data.pop('book_id')
            OrderItem.objects.create(order=order, book=book, **order_item_data)

        order.total_amount = sum(
            order_item.quantity * order_item.book.price for order_item in order.order_items.all()
        )
        order.save()
        return order