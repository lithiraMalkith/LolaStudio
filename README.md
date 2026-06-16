<div align="center">
  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-95tTZWZWaSaVIWjPLpqdQw82gh0KoW5IaFtc3V3NgrQZBAsJxwbUefJe3aJ6w4xmzMpB85nqP3mvTU6Q--EWIEMepBPBptsHC6ZNeeIzL9fYnK1kppT_B3ufPdM37BXnTtnmZZDk3hNwdoM-gYlVVNlTK2c7pi88MzfmULl2ZRe825Mc4gk1D7X9D2jSsdrzHU3Z8huAOct9mcQ5HqBVyXVaAt_Av0IpoeSssApECQ3xdzMXm4VpXL9-gTY4OaxTg1mR4K_6vsDx" alt="Lola Studio Banner" width="100%" style="max-height: 300px; object-fit: cover; border-radius: 8px;" />

  <br />
  <br />

  <h1>✨ Lola Studio ✨</h1>
  <p><strong>An Artisanal, Spiritual-Themed E-Commerce & Admin Platform</strong></p>

  <br />

  <h3>🛠️ Built With</h3>

  <p>
    <a href="https://skillicons.dev">
      <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,firebase,nodejs,vscode&theme=dark" alt="Tech Stack" />
    </a>
  </p>
  <p>
    <em>Powered by GSAP for buttery-smooth micro-interactions.</em>
  </p>
</div>

---

## 📖 Overview

**Lola Studio** is a premium, full-stack e-commerce application crafted with intention. It serves as both a high-end consumer storefront and a comprehensive, deeply-integrated Admin Dashboard for managing products, orders, inventory, custom roles, and customer support inquiries.

Designed with a focus on **spiritual aesthetic** and **artisanal luxury**, the platform utilizes a sleek dark-mode-first design, fluid GSAP animations, and robust backend architecture driven by Firebase and Next.js App Router.

## ✨ Core Features

### 🛍️ Storefront (Consumer)
- **Fluid UI/UX**: Immersive page transitions and scroll animations powered by GSAP.
- **Product Discovery**: Browse beautiful, high-quality artisanal products with dynamic routing.
- **Account Dashboard**: Secure member portal to manage "Soul Name" (Identity), track order history, and monitor spiritual resonances (Contact Info).
- **Secure Messaging**: Authenticated users can send direct messages and inquiries to the support staff.

### 🛡️ Admin Dashboard
- **Role-Based Access Control (RBAC)**: Fine-grained, custom permission system (`dashboard:read`, `orders:write`, `messages:delete`, etc.) mapped to built-in (`manager`, `support`, `fulfillment`) and custom roles.
- **Order & Inventory Management**: View, track, and process customer orders while keeping real-time tabs on stock levels.
- **Customer CRM**: Detailed views of registered customers, their order counts, total spent, and repeat status.
- **Support Inbox**: A dedicated, real-time messaging inbox for handling customer inquiries securely.
- **Dynamic Content**: Full CRUD capabilities for Products and Categories.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, yarn, or pnpm
- A [Firebase](https://firebase.google.com/) Project with Auth and Firestore enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lola-studio.git
   cd lola-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your Firebase Admin credentials and Next.js settings:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="your-private-key"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth) with Custom Claims for RBAC.

## 🔒 Security & Roles

Lola Studio utilizes a strict, custom-built middleware (`src/lib/auth-middleware.ts`) that verifies Firebase JWT tokens on every secure API request. 

Admin routes and components are protected at both the layout level and the API level using the `hasPermission('module:action')` pattern, ensuring that fulfillment staff cannot access overarching site settings, and support staff can only access customer and order data.

---
<div align="center">
  <p>Crafted with Intention.</p>
</div>
