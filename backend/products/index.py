import json
import os
import psycopg2

S = "t_p37886766_cash_register_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_from_token(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT u.id, u.role FROM {S}.sessions s JOIN {S}.users u ON u.id=s.user_id WHERE s.token=%s AND s.expires_at > NOW()", (token,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Управление товарами: список, добавление, редактирование, поиск по штрихкоду"""
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
        if method == "GET" and "/barcode/" in path:
            barcode = path.split("/barcode/")[-1]
            cur.execute(f"SELECT id, name, barcode, price, category, description, image_url, stock, discount_percent, promo_label, is_active FROM {S}.products WHERE barcode=%s AND is_active=true", (barcode,))
            p = cur.fetchone()
            if not p:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Товар не найден"})}
            keys = ["id","name","barcode","price","category","description","image_url","stock","discount_percent","promo_label","is_active"]
            prod = dict(zip(keys, p))
            prod["price"] = float(prod["price"])
            return {"statusCode": 200, "headers": headers, "body": json.dumps(prod)}

        elif method == "GET":
            category = params.get("category")
            search = params.get("search")
            active_only = params.get("active_only", "true") == "true"
            sql = f"SELECT id, name, barcode, price, category, description, image_url, stock, discount_percent, promo_label, is_active FROM {S}.products WHERE 1=1"
            args = []
            if active_only:
                sql += " AND is_active=true"
            if category:
                sql += " AND category=%s"
                args.append(category)
            if search:
                sql += " AND (name ILIKE %s OR barcode ILIKE %s)"
                args.extend([f"%{search}%", f"%{search}%"])
            sql += " ORDER BY created_at DESC"
            cur.execute(sql, args)
            rows = cur.fetchall()
            keys = ["id","name","barcode","price","category","description","image_url","stock","discount_percent","promo_label","is_active"]
            products = []
            for r in rows:
                d = dict(zip(keys, r))
                d["price"] = float(d["price"])
                products.append(d)
            return {"statusCode": 200, "headers": headers, "body": json.dumps(products)}

        elif method == "POST":
            user = get_user_from_token(cur, token)
            if not user or user[1] not in ("admin", "cashier"):
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            cur.execute(
                f"INSERT INTO {S}.products (name, barcode, price, category, description, image_url, stock, discount_percent, promo_label, is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get("name"), body.get("barcode"), body.get("price", 0), body.get("category"), body.get("description"), body.get("image_url"), body.get("stock", 0), body.get("discount_percent", 0), body.get("promo_label"), body.get("is_active", True))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id})}

        elif method == "PUT":
            user = get_user_from_token(cur, token)
            if not user or user[1] not in ("admin", "cashier"):
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            prod_id = path.split("/")[-1]
            cur.execute(
                f"UPDATE {S}.products SET name=%s, barcode=%s, price=%s, category=%s, description=%s, image_url=%s, stock=%s, discount_percent=%s, promo_label=%s, is_active=%s WHERE id=%s",
                (body.get("name"), body.get("barcode"), body.get("price"), body.get("category"), body.get("description"), body.get("image_url"), body.get("stock"), body.get("discount_percent", 0), body.get("promo_label"), body.get("is_active", True), prod_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()