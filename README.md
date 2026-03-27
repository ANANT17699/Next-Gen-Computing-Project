# 🩸 E-Blood Bank Management System

A full-stack web application designed to digitize and streamline blood bank operations. The system enables efficient donor management, real-time blood inventory tracking, and seamless hospital request processing.

---

## 📌 Project Overview

Traditional blood bank systems often rely on manual processes, leading to delays, data inconsistencies, and blood wastage.
This project provides a **centralized, secure, and automated platform** to manage blood donation and distribution efficiently.

---

## 🎯 Objectives

* Automate donor registration and management
* Maintain real-time blood inventory
* Enable hospitals to request blood online
* Reduce manual errors and paperwork
* Provide secure authentication and role-based access
* Improve emergency response time

---

## 👥 User Roles

### 🔴 Admin

* Manage donors and hospitals
* Update blood stock
* Approve/reject blood requests
* View reports and analytics

### 🧑‍🤝‍🧑 Donor

* Register and manage profile
* View donation history
* Check blood availability

### 🏥 Hospital

* Register and login
* Search blood availability
* Request blood units
* Track request status

---

## ⚙️ Tech Stack

### 🖥️ Frontend

* HTML
* CSS
* JavaScript
* Bootstrap

### 🔙 Backend

* Java
* Spring Boot

### 🗄️ Database

* MySQL

### 🔗 Other Tools

* REST APIs
* Apache Tomcat
* Git & GitHub
* Postman

---

## 🏗️ System Architecture

The application follows a **three-tier architecture**:

1. **Presentation Layer** – User interface (Frontend)
2. **Business Logic Layer** – Backend using Spring Boot
3. **Data Layer** – MySQL database

---

## ✨ Key Features

* 🔄 Real-time blood inventory tracking
* 🧠 Smart donor matching system
* 🔐 Secure authentication & authorization
* 📊 Admin dashboard with analytics
* 📩 Request management system
* 📱 Responsive UI design

---

## 🗂️ Database Schema

* **Donor** (donor_id, name, age, blood_group, contact, address)
* **Hospital** (hospital_id, name, contact, address)
* **Blood_Stock** (stock_id, blood_group, units_available)
* **Request** (request_id, hospital_id, blood_group, units_required, status)

---

## 🔄 System Workflow

1. Donor registers in the system
2. Admin verifies donor details
3. Blood stock is updated after donation
4. Hospital searches required blood group
5. Hospital submits request
6. Admin approves/rejects request
7. Blood stock updates automatically

---

## 🚀 Installation & Setup

### Prerequisites

* JDK 17+
* MySQL 8.0
* Maven
* IDE (IntelliJ / VS Code)

### Steps

1. Clone the repository

```bash
git clone https://github.com/your-username/e-blood-bank.git
```

2. Navigate to project folder

```bash
cd e-blood-bank
```

3. Configure MySQL database in `application.properties`

4. Run the Spring Boot application

```bash
mvn spring-boot:run
```

5. Open browser

```
http://localhost:8080
```

---

## 📊 Future Scope

* 📱 Mobile application integration
* ☁️ Cloud deployment (AWS/Azure)
* 🤖 AI-based demand prediction
* 📧 SMS & Email notifications
* 🌍 Multi-branch blood bank support

---

## 📷 Screenshots

> *(Add your Figma designs or application screenshots here)*

---

## 🤝 Contributors

* Anant Chauhan
* Sujal Kumar
* Deependra Singh Rathore
* Aryan Bansal
* Vansh

---

## 📄 License

This project is developed for academic purposes and is free to use for learning.

---

## 💡 Acknowledgment

We thank our mentor and institution for their guidance and support throughout the project.

---
