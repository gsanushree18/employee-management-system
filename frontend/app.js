const token = localStorage.getItem("token");
const authNav = document.getElementById("authNav");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const employeeModal = document.getElementById("employeeModal");
const employeeForm = document.getElementById("employeeForm");

// Check Authentication State
if (token) {
  authNav.innerHTML = `<button class="btn btn-danger" onclick="logout()">Logout</button>`;
  if (addEmployeeBtn) addEmployeeBtn.style.display = "block";
} else {
  authNav.innerHTML = `<button class="btn" onclick="window.location.href='login.html'">Admin Login</button>`;
  if (addEmployeeBtn) addEmployeeBtn.style.display = "none";
}

function logout() {
  localStorage.removeItem("token");
  window.location.reload();
}

// Fetch and render employees
async function fetchEmployees() {
  const search = document.getElementById("searchInput").value;
  const department = document.getElementById("departmentFilter").value;

  let url = `/api/employees?search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}`;
  const res = await fetch(url);
  const data = await res.json();

  const tbody = document.getElementById("employeeTableBody");
  tbody.innerHTML = "";

  if (data.success && data.employees.length > 0) {
    data.employees.forEach(emp => {
      let actions = `<span>View</span>`;
      if (token) {
        actions = `
          <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick="openEditModal(${emp.id})">Edit</button>
          <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick="deleteEmployee(${emp.id})">Delete</button>
        `;
      }
      tbody.innerHTML += `
        <tr>
          <td>${emp.name}</td>
          <td>${emp.email}</td>
          <td>${emp.phone}</td>
          <td>${emp.department}</td>
          <td>${emp.designation}</td>
          <td>₹${emp.salary}</td>
          <td>${actions}</td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No employees found</td></tr>`;
  }
}

document.getElementById("searchInput").addEventListener("input", fetchEmployees);
document.getElementById("departmentFilter").addEventListener("change", fetchEmployees);

// Modal controls
if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener("click", () => {
    document.getElementById("modalTitle").innerText = "Add Employee";
    document.getElementById("employeeId").value = "";
    employeeForm.reset();
    employeeModal.style.display = "flex";
  });
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
  employeeModal.style.display = "none";
});

async function openEditModal(id) {
  const res = await fetch(`/api/employees/${id}`);
  const data = await res.json();
  if (data.success) {
    const emp = data.employee;
    document.getElementById("modalTitle").innerText = "Edit Employee";
    document.getElementById("employeeId").value = emp.id;
    document.getElementById("name").value = emp.name;
    document.getElementById("email").value = emp.email;
    document.getElementById("phone").value = emp.phone;
    document.getElementById("department").value = emp.department;
    document.getElementById("designation").value = emp.designation;
    document.getElementById("salary").value = emp.salary;
    document.getElementById("date_of_joining").value = emp.date_of_joining;
    employeeModal.style.display = "flex";
  }
}

employeeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("employeeId").value;
  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    department: document.getElementById("department").value,
    designation: document.getElementById("designation").value,
    salary: parseFloat(document.getElementById("salary").value),
    date_of_joining: document.getElementById("date_of_joining").value
  };

  const url = id ? `/api/employees/${id}` : `/api/employees`;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    employeeModal.style.display = "none";
    fetchEmployees();
  } else {
    alert(data.message);
  }
});

async function deleteEmployee(id) {
  if (confirm("Are you sure you want to delete this employee?")) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      fetchEmployees();
    } else {
      alert(data.message);
    }
  }
}

// Initial load
fetchEmployees();