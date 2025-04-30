# 📅 Scheduling Server - Python + Flask

This is a simple scheduling API built with **Python** and **Flask**. It allows you to create, list, retrieve, and update scheduling records.

---

## 🚀 How to Run the Project

### ✅ Requirements

- Python installed on your machine.

### 🔧 Installation

Install Flask:

#### Windows:
```bash
pip install flask
```

#### Linux or Mac:
```bash
pip3 install flask
```

### **1. Get all schedulings**
- **Method**: `GET`
- **Endpoint**: `/coletas`
- **Description**: Retrieve a list of all scheduling records.
- **Response**: 
  - `200 OK` – List of all scheduling entries.

---

### **2. Get scheduling by ID**
- **Method**: `GET`
- **Endpoint**: `/coletas/<id>`
- **Description**: Retrieve a specific scheduling by its ID.
- **Response**:
  - `200 OK` – Returns the scheduling data for the provided ID.
  - `404 Not Found` – If the scheduling with the given ID is not found.

---

### **3. Create new scheduling**
- **Method**: `POST`
- **Endpoint**: `/coletas`
- **Description**: Create a new scheduling record.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "address": "123 Main St",
    "date": "2025-05-01"
  }
