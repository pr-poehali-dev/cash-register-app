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
    """Управление пользователями: список, пополнение баланса по email"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
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

        user_id, user_role = user

        if method == "GET":
            if user_role != "admin":
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            cur.execute(f"SELECT id, email, name, role, balance, created_at FROM {S}.users ORDER BY created_at DESC")
            rows = cur.fetchall()
            users = [{"id": r[0], "email": r[1], "name": r[2], "role": r[3], "balance": float(r[4]), "created_at": str(r[5])} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(users)}

        elif method == "POST" and "/topup" in path:
            if user_role != "admin":
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            email = body.get("email", "").strip()
            amount = float(body.get("amount", 0))
            if amount <= 0:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Сумма должна быть больше 0"})}
            cur.execute(f"SELECT id, balance FROM {S}.users WHERE email=%s", (email,))
            target = cur.fetchone()
            if not target:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Пользователь не найден"})}
            cur.execute(f"UPDATE {S}.users SET balance = balance + %s WHERE email=%s RETURNING balance", (amount, email))
            new_balance = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True, "new_balance": float(new_balance)})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()