from django.db import connection

def get_user_orders(user_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM SelectAllUserOrders(%s)", [user_id])
        columns = [col[0] for col in cursor.description]
        results = [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]
    return results