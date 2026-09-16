const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./database");
const { verifyToken, JWT_SECRET } = require("./auth");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// 1. POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ success: true, message: "Login successful", token });
  });
});

// 2. GET /api/employees
app.get("/api/employees", (req, res) => {
  const { search, department } = req.query;
  let query = "SELECT * FROM employees WHERE 1=1";
  let params = [];

  if (search) {
    query += " AND (name LIKE ? OR department LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (department && department !== "All") {
    query += " AND department = ?";
    params.push(department);
  }

  query += " ORDER BY id DESC";

  db.all(query, params, (err, employees) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, employees });
  });
});

// 3. GET /api/employees/:id
app.get("/api/employees/:id", (req, res) => {
  db.get("SELECT * FROM employees WHERE id = ?", [req.params.id], (err, employee) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, employee });
  });
});

// 4. POST /api/employees (Admin Only)
app.post("/api/employees", verifyToken, (req, res) => {
  const { name, email, phone, department, designation, salary, date_of_joining } = req.body;

  if (!name || !email || !phone || !department || !designation || !salary || !date_of_joining) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (isNaN(salary) || Number(salary) <= 0) {
    return res.status(400).json({ success: false, message: "Salary must be a positive number" });
  }

  db.get("SELECT id FROM employees WHERE email = ?", [email], (err, existing) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const query = `
      INSERT INTO employees (name, email, phone, department, designation, salary, date_of_joining) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [name, email, phone, department, designation, salary, date_of_joining], function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.status(201).json({ success: true, message: "Employee created successfully", employeeId: this.lastID });
    });
  });
});

// 5. PUT /api/employees/:id (Admin Only)
app.put("/api/employees/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, department, designation, salary, date_of_joining } = req.body;

  db.get("SELECT * FROM employees WHERE id = ?", [id], (err, employee) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    if (salary && (isNaN(salary) || Number(salary) <= 0)) {
      return res.status(400).json({ success: false, message: "Salary must be a positive number" });
    }

    const updateProcess = () => {
      const query = `
        UPDATE employees SET 
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          department = COALESCE(?, department),
          designation = COALESCE(?, designation),
          salary = COALESCE(?, salary),
          date_of_joining = COALESCE(?, date_of_joining)
        WHERE id = ?
      `;
      db.run(query, [name, email, phone, department, designation, salary, date_of_joining, id], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Employee updated successfully" });
      });
    };

    if (email && email !== employee.email) {
      db.get("SELECT id FROM employees WHERE email = ?", [email], (err, existing) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        if (existing) {
          return res.status(409).json({ success: false, message: "Email already exists" });
        }
        updateProcess();
      });
    } else {
      updateProcess();
    }
  });
});

// 6. DELETE /api/employees/:id (Admin Only)
app.delete("/api/employees/:id", verifyToken, (req, res) => {
  db.get("SELECT * FROM employees WHERE id = ?", [req.params.id], (err, employee) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    db.run("DELETE FROM employees WHERE id = ?", [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "Employee deleted successfully" });
    });
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});