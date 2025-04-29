from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.db import connection
from decimal import Decimal

class User(models.Model):
    user_id = models.AutoField(primary_key=True, db_column='UserID')
    first_name = models.CharField(max_length=100, db_column='FirstName')
    last_name = models.CharField(max_length=100, db_column='LastName')
    email = models.EmailField(unique=True, blank=True, null=True, db_column='Email')
    phone = models.CharField(max_length=20, blank=True, null=True, db_column='Phone')
    address = models.TextField(blank=True, null=True, db_column='Address')
    password = models.CharField(max_length=128, db_column='Password', blank=True, null=True)
    is_admin = models.BooleanField(default=False, db_column='IsAdmin')

    class Meta:
        db_table = 'Users'
        
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)


class Author(models.Model):
    author_id = models.AutoField(primary_key=True, db_column='AuthorID')
    first_name = models.CharField(max_length=100, db_column='FirstName')
    last_name = models.CharField(max_length=100, db_column='LastName')
    birthdate = models.DateField(blank=True, null=True, db_column='Birthdate')

    class Meta:
        db_table = 'Authors'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Publisher(models.Model):
    publisher_id = models.AutoField(primary_key=True, db_column='PublisherID')
    publisher_name = models.CharField(max_length=255, db_column='PublisherName')
    address = models.TextField(blank=True, null=True, db_column='Address')
    phone = models.CharField(max_length=20, blank=True, null=True, db_column='Phone')
    email = models.EmailField(blank=True, null=True, db_column='Email')

    class Meta:
        db_table = 'Publishers'

    def __str__(self):
        return self.publisher_name

class Genre(models.Model):
    genre_id = models.AutoField(primary_key=True, db_column='GenreID')
    genre_name = models.CharField(max_length=100, db_column='GenreName')

    class Meta:
        db_table = 'Genres'

    def __str__(self):
        return self.genre_name

class Book(models.Model):
    book_id = models.AutoField(primary_key=True, db_column='BookID')
    title = models.CharField(max_length=255, db_column='Title')
    publication_date = models.DateField(blank=True, null=True, db_column='PublicationDate')
    price = models.DecimalField(max_digits=10, decimal_places=2, db_column='Price')
    cover = models.ImageField(upload_to='covers/', null=True, blank=True)
    genre = models.ForeignKey('Genre', on_delete=models.SET_NULL, null=True, blank=True, db_column='GenreID', related_name='primary_books')
    author = models.ForeignKey('Author', on_delete=models.SET_NULL, null=True, blank=True, db_column='AuthorID')
    publisher = models.ForeignKey('Publisher', on_delete=models.SET_NULL, null=True, blank=True, db_column='PublisherID')

    class Meta:
        db_table = 'Books'

    def __str__(self):
        return self.title

class Order(models.Model):
    order_id = models.AutoField(primary_key=True, db_column='OrderID')
    user = models.ForeignKey('User', on_delete=models.CASCADE, db_column='UserID')
    order_date = models.DateField(db_column='OrderDate')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, db_column='TotalAmount')

    class Meta:
        db_table = 'Orders'

    def __str__(self):
        return f"Order #{self.order_id}"
    
    @staticmethod
    def calculate_user_spending(user_id, start_date, end_date):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DECLARE @TotalSpent DECIMAL(10, 2);
                EXEC CalculateUserSpending @UserID = %s, @StartDate = %s, @EndDate = %s, @TotalSpent = @TotalSpent OUTPUT;
                SELECT @TotalSpent;
                """,
                [user_id, start_date, end_date]
            )
            result = cursor.fetchone()
            return float(result[0]) if result and result[0] is not None else 0.0

class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True, db_column='OrderItemID')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items', db_column='OrderID')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, db_column='BookID')
    quantity = models.PositiveIntegerField(db_column='Quantity')

    class Meta:
        db_table = 'OrderItems'

    def __str__(self):
        return f"{self.book.title} x {self.quantity}"