import json
import os
import psycopg2

S = "t_p37886766_cash_register_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_from_token(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT u.id, u.role, u.balance FROM {S}.sessions s JOIN {S}.users u ON u.id=s.user_id WHERE s.token=%s AND s.expires_at > NOW()", (token,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Заказы: создание, получение, смена статуса, получение для конкретного пользователя"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Требуется авторизация"})}

        user_id, user_role, user_balance = user

        if method == "POST" and "/create" in path:
            items = body.get("items", [])
            payment_method = body.get("payment_method", "card")
            note = body.get("note", "")
            if not items:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Корзина пуста"})}
            total = sum(float(i["price"]) * int(i["quantity"]) for i in items)
            if payment_method == "card":
                if float(user_balance) < total:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Недостаточно средств на карте"})}
                cur.execute(f"UPDATE {S}.users SET balance = balance - %s WHERE id = %s", (total, user_id))
            cur.execute(f"INSERT INTO {S}.orders (user_id, total, status, payment_method, note) VALUES (%s,%s,'pending',%s,%s) RETURNING id", (user_id, total, payment_method, note))
            order_id = cur.fetchone()[0]
            for item in items:
                cur.execute(f"INSERT INTO {S}.order_items (order_id, product_id, product_name, price, quantity) VALUES (%s,%s,%s,%s,%s)", (order_id, item.get("product_id"), item.get("product_name"), float(item["price"]), int(item["quantity"])))
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"order_id": order_id})}

        elif method == "GET" and "/my" in path:
            cur.execute(f"SELECT o.id, o.total, o.status, o.payment_method, o.note, o.created_at, o.updated_at FROM {S}.orders o WHERE o.user_id=%s ORDER BY o.created_at DESC", (user_id,))
            orders_raw = cur.fetchall()
            orders = []
            for row in orders_raw:
                oid = row[0]
                cur.execute(f"SELECT product_name, price, quantity FROM {S}.order_items WHERE order_id=%s", (oid,))
                items_raw = cur.fetchall()
                items_list = [{"product_name": r[0], "price": float(r[1]), "quantity": r[2]} for r in items_raw]
                orders.append({"id": oid, "total": float(row[1]), "status": row[2], "payment_method": row[3], "note": row[4], "created_at": str(row[5]), "updated_at": str(row[6]), "items": items_list})
            return {"statusCode": 200, "headers": headers, "body": json.dumps(orders)}

        elif method == "GET":
            if user_role not in ("admin", "cashier"):
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            status_filter = params.get("status")
            sql = f"SELECT o.id, o.total, o.status, o.payment_method, o.note, o.created_at, o.updated_at, u.name, u.email FROM {S}.orders o JOIN {S}.users u ON u.id=o.user_id WHERE 1=1"
            args = []
            if status_filter:
                sql += " AND o.status=%s"
                args.append(status_filter)
            sql += " ORDER BY o.created_at DESC LIMIT 100"
            cur.execute(sql, args)
            orders_raw = cur.fetchall()
            orders = []
            for row in orders_raw:
                oid = row[0]
                cur.execute(f"SELECT product_name, price, quantity FROM {S}.order_items WHERE order_id=%s", (oid,))
                items_raw = cur.fetchall()
                items_list = [{"product_name": r[0], "price": float(r[1]), "quantity": r[2]} for r in items_raw]
                orders.append({"id": oid, "total": float(row[1]), "status": row[2], "payment_method": row[3], "note": row[4], "created_at": str(row[5]), "updated_at": str(row[6]), "client_name": row[7], "client_email": row[8], "items": items_list})
            return {"statusCode": 200, "headers": headers, "body": json.dumps(orders)}

        elif method == "PUT" and "/status" in path:
            if user_role not in ("admin", "cashier"):
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            parts = [p for p in path.split("/") if p]
            order_id = parts[-2] if len(parts) >= 2 else parts[-1]
            new_status = body.get("status")
            valid_statuses = ["pending", "processing", "ready", "completed", "cancelled"]
            if new_status not in valid_statuses:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Недопустимый статус"})}
            cur.execute(f"UPDATE {S}.orders SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, order_id))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()