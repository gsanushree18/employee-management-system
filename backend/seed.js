const db = require("./database");
const bcrypt = require("bcryptjs");

console.log("Seeding database...");

db.serialize(() => {
  db.run("DELETE FROM admins;");
  db.run("DELETE FROM employees;");

  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hashedPassword]);

  const sampleEmployees = [
    ["Aarav Sharma", "aarav.sharma@example.com", "9876543210", "Engineering", "Software Engineer", 75000, "2023-01-15"],
    ["Priya Patel", "priya.patel@example.com", "9876543211", "Human Resources", "HR Manager", 65000, "2022-05-10"],
    ["Rahul Kumar", "rahul.kumar@example.com", "9876543212", "Finance", "Accountant", 60000, "2023-03-20"],
    ["Ananya Iyer", "ananya.iyer@example.com", "9876543213", "Engineering", "UI/UX Designer", 70000, "2023-07-01"],
    ["Vikram Singh", "vikram.singh@example.com", "9876543214", "Marketing", "Marketing Lead", 68000, "2021-11-12"],
    ["Neha Gupta", "neha.gupta@example.com", "9876543215", "Engineering", "Backend Developer", 80000, "2022-08-25"],
    ["Karan Verma", "karan.verma@example.com", "9876543216", "Sales", "Sales Executive", 50000, "2024-02-10"],
    ["Divya Rao", "divya.rao@example.com", "9876543217", "Customer Support", "Support Lead", 45000, "2023-06-18"]
  ];

  const stmt = db.prepare(`
    INSERT INTO employees (name, email, phone, department, designation, salary, date_of_joining) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const emp of sampleEmployees) {
    stmt.run(emp);
  }
  stmt.finalize();

  console.log("Database seeded successfully!");
  setTimeout(() => process.exit(0), 500);
});