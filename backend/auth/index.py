import json
import os
import secrets
from datetime import datetime, timedelta
import psycopg2

S = "t_p37886766_cash_register_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """Авторизация: вход, регистрация, выход, получение текущего пользователя"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    try:
        if "/login" in path and method == "POST":
            email = body.get("email", "").strip()
            password = body.get("password", "")
            cur.execute(f"SELECT id, email, name, role, balance FROM {S}.users WHERE email=%s AND password_hash=%s", (email, password))
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=7)
            cur.execute(f"INSERT INTO {S}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user[0], token, expires))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"token": token, "user": {"id": user[0], "email": user[1], "name": user[2], "role": user[3], "balance": float(user[4])}})}

        elif "/register" in path and method == "POST":
            email = body.get("email", "").strip()
            password = body.get("password", "")
            name = body.get("name", "").strip()
            if not email or not password or not name:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}
            cur.execute(f"SELECT id FROM {S}.users WHERE email=%s", (email,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": headers, "body": json.dumps({"error": "Пользователь уже существует"})}
            cur.execute(f"INSERT INTO {S}.users (email, password_hash, name, role, balance) VALUES (%s, %s, %s, 'client', 0) RETURNING id", (email, password, name))
            user_id = cur.fetchone()[0]
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=7)
            cur.execute(f"INSERT INTO {S}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, token, expires))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"token": token, "user": {"id": user_id, "email": email, "name": name, "role": "client", "balance": 0.0}})}

        elif "/me" in path and method == "GET":
            token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
            if not token:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет токена"})}
            cur.execute(f"SELECT u.id, u.email, u.name, u.role, u.balance FROM {S}.sessions s JOIN {S}.users u ON u.id=s.user_id WHERE s.token=%s AND s.expires_at > NOW()", (token,))
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"user": {"id": user[0], "email": user[1], "name": user[2], "role": user[3], "balance": float(user[4])}})}

        elif "/logout" in path and method == "POST":
            token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
            if token:
                cur.execute(f"UPDATE {S}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()