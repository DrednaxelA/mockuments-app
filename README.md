Dokuments 📄

Dokuments is a specialized React-based tool designed for Content Designers and QA Engineers to generate high-fidelity "scanned-style" dummy documents. It is specifically built to test OCR (Optical Character Recognition) engines by simulating physical document artifacts.

🚀 Features

🌍 Multi-Region Support

Global Regions: UK, Australia, USA, France.

Auto-Localization: Automatically adjusts Currency (£/$/€), Date Formats (DD/MM vs MM/DD), Tax Labels (VAT/ABN/Tax ID), and Tax Rates.

🏭 Generation Engines

Manual Mode: Precision control for creating specific test cases (e.g., custom supplier names, dates, and totals).

Automated Mode: Bulk generation (up to 50 docs) using randomized datasets for stress testing.

📄 Document Types

Costs: Receipts, Invoices, ATM Withdrawals.

Sales: Sales Invoices, Sales Receipts.

Vault: Insurance Policies, Tax Filings, Tenancy Agreements (includes auto-generated placeholder text).

🤖 OCR Simulation

Flattened Output: Documents are captured as high-resolution images and wrapped in PDFs to ensure OCR engines must process the visual data rather than reading text layers.

Scanned Aesthetic: Applies SVG turbulence noise (paper grain) and random subtle rotation (-0.75° to 0.75°) to simulate a physical scanner feed.

🎨 Visuals

Deep Dark Mode UI.

Live Preview: Real-time visual feedback of the document layout before generation.

🛠️ Tech Stack

Framework: React

Styling: Tailwind CSS

Icons: Lucide React

PDF Engine: html2canvas + jsPDF

Bundling: JSZip (for bulk downloads)

📦 Deployment Guide

Local Development

Clone the repository.

Ensure you have node and npm installed.

Run npm install to install dependencies.

Run npm start to launch the development server.

Deploy to Render

Push your code to a GitHub repository.

Log in to Render.

Create a New Static Site.

Connect your GitHub repository.

Set the Build Command to npm run build.

Set the Publish Directory to build.

Click Deploy.

📄 License

This project is intended for internal testing and QA purposes.