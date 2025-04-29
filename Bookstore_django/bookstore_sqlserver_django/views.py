from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.decorators import action, api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
from .utils import get_user_orders
from datetime import datetime

class CalculateUserSpendingView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not all([user_id, start_date, end_date]):
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = int(user_id)
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total_spent = Order.calculate_user_spending(user_id, start_date, end_date)
            return Response({'user_id': user_id, 'total_spent': float(total_spent)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
def user_orders_view(request, user_id):
    orders = get_user_orders(user_id)
    return Response(orders)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email=email)
        return queryset
    
    def perform_create(self, serializer):
        user = serializer.save()
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        remember_me = request.data.get('remember_me', False)

        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                request.session['user_id'] = user.user_id
                if not remember_me:
                    request.session.set_expiry(0)
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'user_id': user.user_id,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_admin': user.is_admin,
                    }
                }, status=status.HTTP_200_OK)
            return Response({'error': 'Wrong password'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'User hasn\'t been found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def check_auth(self, request):
        user_id = request.session.get('user_id')
        if user_id:
            try:
                user = User.objects.get(user_id=user_id)
                return Response({
                    'user': {
                        'user_id': user.user_id,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_admin': user.is_admin,
                    }
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'error': 'User hasn\'t been found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'Didn\'t authorize'}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        request.session.flush()
        return Response({'message': 'Successful logout'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def delete_user(self, request, pk=None):
        """
        Delete user
        Admin only
        """
        try:
            user = self.get_object()
            user.delete()
            return Response({"message": f"User {user.first_name} {user.last_name} has been deleted."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User hasn't been found."}, status=status.HTTP_404_NOT_FOUND)
                             
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context

    def update(self, request, *args, **kwargs):
        book = self.get_object()
        serializer = self.get_serializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            book = self.get_object()
            book_title = book.title
            book.delete()
            return Response(
                {"message": f"Book '{book_title}' deleted successfully."},
                status=status.HTTP_200_OK
            )
        except Book.DoesNotExist:
            return Response(
                {"error": "Book not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer


class PublisherViewSet(viewsets.ModelViewSet):
    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if not user_id:
            raise serializers.ValidationError("Didn't specify user.")
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "User with ID doesn't exist.")
        serializer.save(user=user)

    def get_queryset(self):
        user_id = self.request.data.get(
            'user_id') or self.request.query_params.get('user_id')
        if user_id:
            return Order.objects.filter(user__user_id=user_id)
        return Order.objects.none()
