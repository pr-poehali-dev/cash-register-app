
CREATE TABLE IF NOT EXISTS t_p37886766_cash_register_app.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p37886766_cash_register_app.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  image_url TEXT,
  stock INT NOT NULL DEFAULT 0,
  discount_percent INT DEFAULT 0,
  promo_label VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p37886766_cash_register_app.orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES t_p37886766_cash_register_app.users(id),
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30) DEFAULT 'card',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p37886766_cash_register_app.order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES t_p37886766_cash_register_app.orders(id),
  product_id INT REFERENCES t_p37886766_cash_register_app.products(id),
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS t_p37886766_cash_register_app.sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES t_p37886766_cash_register_app.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
