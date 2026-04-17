const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const db = new Database('database.db');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'secreto123',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static('public'));

// Crear tabla
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)
`).run();

// Crear usuario
app.get('/crear', async (req, res) => {
  const username = "admin";
  const password = "1234";

  const hash = await bcrypt.hash(password, 10);

  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hash);
    res.send("Usuario creado");
  } catch {
    res.send("El usuario ya existe");
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user) return res.send("Usuario no existe");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.send("Contraseña incorrecta");

  req.session.user = user.username;
  res.send("OK");
});

// Página privada
app.get('/privado', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/public/privado.html');
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));