const express = require('express');
const path = require('path');
const db = require('./db');
const app = express();
require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const [items] = await db.query('SELECT * FROM purchase_item');
  const [summary] = await db.query(`
    SELECT 
      SUM(cost * quantity) AS total_cost,
      COUNT(*) AS total_items 
    FROM purchase_item
  `);

  // HAD TO FIX STRINGS AND NUMBERS
  if (summary[0].total_cost !== null) {
    summary[0].total_cost = parseFloat(summary[0].total_cost);
  }

  const cleanedItems = items.map(item => ({
    ...item,
    cost: parseFloat(item.cost)
  }));

  res.render('index', { items: cleanedItems, summary: summary[0] });
});

// Add new
app.post('/add', async (req, res) => {
  const { item_name, item_description, cost, quantity } = req.body;
  await db.query(
    'INSERT INTO purchase_item (item_name, item_description, cost, quantity) VALUES (?, ?, ?, ?)',
    [item_name, item_description, cost, quantity]
  );
  res.redirect('/');
});

// Delete (RED)
app.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM purchase_item WHERE purchase_item_id = ?', [req.params.id]);
  res.redirect('/');
});

// Increase (GREEN)
app.post('/up/:id', async (req, res) => {
  await db.query('UPDATE purchase_item SET quantity = quantity + 1 WHERE purchase_item_id = ?', [req.params.id]);
  res.redirect('/');
});

// Decrease (YELOW)
app.post('/down/:id', async (req, res) => {
  await db.query('UPDATE purchase_item SET quantity = GREATEST(quantity - 1, 0) WHERE purchase_item_id = ?', [req.params.id]);
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
