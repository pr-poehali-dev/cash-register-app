
INSERT INTO t_p37886766_cash_register_app.users (email, password_hash, name, role, balance)
SELECT 'admin@pos.ru', 'admin2015!RM', 'Администратор', 'admin', 0
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.users WHERE email = 'admin@pos.ru');

INSERT INTO t_p37886766_cash_register_app.users (email, password_hash, name, role, balance)
SELECT 'cashier@pos.ru', 'admin2015!RM', 'Кассир', 'cashier', 0
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.users WHERE email = 'cashier@pos.ru');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Кофе Americano', '4607031759014', 120.00, 'Напитки', 'Классический черный кофе', 100, 0, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759014');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Круассан с маслом', '4607031759021', 85.00, 'Выпечка', 'Свежая выпечка каждое утро', 50, 10, 'Хит', true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759021');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Яблочный сок 0.5л', '4607031759038', 95.00, 'Напитки', 'Натуральный сок', 80, 0, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759038');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Шоколадный батончик', '4607031759045', 65.00, 'Сладости', 'Молочный шоколад с карамелью', 200, 15, 'Акция', true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759045');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Минеральная вода 0.5л', '4607031759052', 55.00, 'Напитки', 'Негазированная', 150, 0, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759052');

INSERT INTO t_p37886766_cash_register_app.products (name, barcode, price, category, description, stock, discount_percent, promo_label, is_active)
SELECT 'Сэндвич с курицей', '4607031759069', 195.00, 'Еда', 'С свежими овощами и соусом', 30, 0, 'Новинка', true
WHERE NOT EXISTS (SELECT 1 FROM t_p37886766_cash_register_app.products WHERE barcode = '4607031759069');
