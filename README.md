# ⚡ InnVoice - Premium MERN Invoice Generator & CRM

InnVoice is a premium, visually stunning full-stack invoice generation and client management (CRM) application. It features a modern dark-mode glassmorphic interface, hardware-accelerated **3D hover tilt visual effects**, custom analytics charts, real-time invoice calculations, and optimized PDF print outputs.

---

## ✨ Key Features

*   **🕶️ 3D Card Visuals**: Interactive stats cards on the dashboard that react to your mouse movements, tilting dynamically in 3D space with float depth parallax.
*   **📊 SVG Revenue Analytics**: A custom-drawn, animated line-area graph showing monthly earnings history.
*   **⚙️ Real-time Billing Engine**: A split-screen creator UI that calculates subtotals, item discounts, tax variables, and totals in real-time as you type, rendering a live print preview instantly.
*   **👤 CRM Client Manager**: Track and view client contacts, including their total transaction history, current invoiced balances, and outstanding dues.
*   **🖨️ Native Print Engine**: Optimized print stylesheet layouts (`@media print`) that hide menus and page buttons, rendering a clean, professional A4 invoice sheet when saving to PDF.
*   **🔐 MongoDB Data Management**: A robust Node.js backend using Express and Mongoose schemas to store and manage invoices, clients, and settings.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js (Vite, JavaScript, ES Modules)
*   **Backend**: Node.js & Express (JavaScript)
*   **Database**: MongoDB (Mongoose ODM)
*   **Styling**: HTML5 & Vanilla CSS (including hardware-accelerated 3D CSS Transforms)

---

## 📂 Project Structure

```
invoice-generator/
├── backend/            # Node.js + Express Server API
│   ├── src/
│   │   ├── models/     # Mongoose Schemas (Client, Invoice, Settings)
│   │   └── server.js   # Express entry, API controllers, database seeder
│   └── package.json
│
├── frontend/           # React.js SPA Frontend
│   ├── src/
│   │   ├── components/ # Shared Layout components (Navigation sidebar)
│   │   ├── pages/      # Views (Dashboard, Invoices, Editor, CRM, Settings)
│   │   ├── App.jsx     # SPA Routing Engine
│   │   ├── index.css   # Dark glassmorphic design variables & 3D CSS properties
│   │   └── main.jsx
│   └── package.json
│
└── .gitignore          # Excludes node_modules, builds, and keys
```

---

## 🚀 Getting Started

### Prerequisites
*   Make sure you have **Node.js** and **MongoDB** installed and running on your local machine.

### 1. Setup Backend
1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/innvoice
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the development API server:
    ```bash
    npm run dev
    ```
    *Note: On first startup, the server automatically seeds the database with mock invoices and clients so you have demo data.*

### 2. Setup Frontend
1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development web client:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to **`http://localhost:5173`**.

---

## 🎨 Design Systems & UI Details

All components are designed with a cohesive color palette of deep navy, violet, indigo, and translucent glass borders. All mouse tilt tracking runs on a pure CSS 3D perspective system, ensuring 60fps animations.
