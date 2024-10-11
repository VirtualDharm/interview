const express = require('express');
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',  
  database: 'interview', 
  password: 'root', 
});

const app = express();
const port = 3000;

const setupDatabase = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }

    connection.query(`
      CREATE TABLE IF NOT EXISTS address (
        address_id INT AUTO_INCREMENT PRIMARY KEY,
        city VARCHAR(100),
        country VARCHAR(100),
        street_no VARCHAR(50)
      );
    `, (err) => {
      if (err) throw err;
      console.log('Address table created.');
    });

    connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone_no VARCHAR(20),
        email_address VARCHAR(100),
        address_id INT,
        FOREIGN KEY (address_id) REFERENCES address(address_id)
      );
    `, (err) => {
      if (err) throw err;
      console.log('Users table created.');
    });

    connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100),
        category CHAR(1)
      );
    `, (err) => {
      if (err) throw err;
      console.log('Products table created.');
    });

    connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        user_id INT,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );
    `, (err) => {
      if (err) throw err;
      console.log('Orders table created.');
    });

    connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        payment_status VARCHAR(50),
        payment_date DATE,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      );
    `, (err) => {
      if (err) throw err;
      console.log('Payments table created.');
    });

    connection.query(`
      INSERT INTO address (city, country, street_no)
      VALUES ('Delhi', 'India', '123'), ('Mumbai', 'India', '456'), ('Bangalore', 'India', '789')
      ON DUPLICATE KEY UPDATE address_id=address_id;
    `, (err) => {
      if (err) throw err;
      console.log('Data inserted into address table.');
    });

    connection.query(`
      INSERT INTO users (first_name, last_name, phone_no, email_address, address_id)
      VALUES 
      ('Rahul', 'Sharma', '9876543210', 'rahul.sharma@gmail.com', 1),
      ('Priya', 'Kapoor', '9123456789', 'priya.kapoor@gmail.com', 2),
      ('Vikram', 'Singh', '8899776655', 'vikram.singh@gmail.com', 3)
      ON DUPLICATE KEY UPDATE user_id=user_id;
    `, (err) => {
      if (err) throw err;
      console.log('Data inserted into users table.');
    });

    connection.query(`
      INSERT INTO products (product_name, category)
      VALUES ('Product A', 'A'), ('Product B', 'B'), ('Product C', 'C')
      ON DUPLICATE KEY UPDATE product_id=product_id;
    `, (err) => {
      if (err) throw err;
      console.log('Data inserted into products table.');
    });

    connection.query(`
      INSERT INTO orders (product_id, user_id, ordered_at)
      VALUES (1, 1, '2024-10-10 10:00:00'), (2, 2, '2024-10-10 11:00:00'), (3, 3, '2024-10-11 12:00:00')
      ON DUPLICATE KEY UPDATE order_id=order_id;
    `, (err) => {
      if (err) throw err;
      console.log('Data inserted into orders table.');
    });

    connection.query(`
      INSERT INTO payments (order_id, payment_status, payment_date)
      VALUES (1, 'failed', '2024-10-10'), (2, 'successful', '2024-10-10'), (3, 'successful', '2024-10-11')
      ON DUPLICATE KEY UPDATE payment_id=payment_id;
    `, (err) => {
      if (err) throw err;
      console.log('Data inserted into payments table.');
    });

    connection.release();
  });
};

app.get('/failed-payments', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      res.status(500).send('Error connecting to the database');
      return;
    }

    connection.query(`
      SELECT u.first_name, u.last_name, u.email_address, p.product_name, a.city, a.country, pay.payment_status
      FROM users u
      JOIN address a ON u.address_id = a.address_id
      JOIN orders o ON u.user_id = o.user_id
      JOIN products p ON o.product_id = p.product_id
      JOIN payments pay ON o.order_id = pay.order_id
      WHERE pay.payment_status = 'failed'
      AND pay.payment_date = '2024-10-10'
      AND a.city = 'Delhi'
      AND p.product_name = 'Product A';
    `, (err, rows) => {
      if (err) {
        res.status(500).send('Error fetching data');
        return;
      }

      res.json(rows);
      connection.release();
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

setupDatabase();