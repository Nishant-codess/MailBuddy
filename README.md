MailBuddy – AI-Powered Email Campaign Builder


MailBuddy is a smart email marketing tool that uses Generative AI to create, personalize, and send high-impact email campaigns.
It analyzes customer data to craft engaging content tailored to each recipient — helping businesses connect more effectively with their audience.


<p align="center"><i>AI-driven email creation directly from your dashboard.</i></p>
✨ Features
🤖 AI Campaign Generation – Create subject lines & email bodies from simple prompts using Google Gemini API.

📊 Customer Data Insights – Upload CSVs, get AI-generated summaries & trends.

🎯 Personalized Content – Emails tailored to each recipient’s data.

🗓 Scheduled Sending – Plan campaigns ahead & send at the perfect time.

📈 Open Rate Tracking – 1×1 tracking pixel monitors email performance in real time.

🔐 Secure Auth – Firebase Authentication for safe user management.

🎨 Modern UI – Built with ShadCN UI & Tailwind CSS for a clean, responsive design.

🛠 Tech Stack
Frontend Framework: Next.js (App Router)

Language: TypeScript

Generative AI: Google Gemini API

Backend & Database: Firebase (Firestore, Authentication)

UI Components: ShadCN UI

Styling: Tailwind CSS

Email Sending: Nodemailer via SMTP

Deployment: Vercel

🚀 Getting Started
1. Prerequisites
Node.js v18 or later

A Firebase project

A Google AI API key for Gemini

An SMTP provider (Gmail, SendGrid, Mailgun, etc.)

2. Clone the Repository
bash
Copy
Edit
git clone https://github.com/your-username/MailBuddy.git
cd MailBuddy
3. Install Dependencies
bash
Copy
Edit
npm install
4. Set Up Environment Variables
Create a .env file in the root directory and fill it with your own credentials.
⚠ Do not commit this file to GitHub — it contains sensitive information.

Here’s an example .env.example:

env
Copy
Edit
# === Firebase Public Config ===
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# === Firebase Admin (Private) ===
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"

# === Google Gemini AI ===
GEMINI_API_KEY=your_gemini_api_key

# === SMTP (Private) ===
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# === Application URL ===
NEXT_PUBLIC_APP_URL=http://localhost:9002
💡 Note:
To get these credentials:

Firebase keys – in your Firebase console → Project Settings → General → "Web App" section.

Firebase Admin keys – create a Service Account under "Project Settings → Service Accounts" and generate a new private key JSON.

Gemini API key – from Google AI Studio.

SMTP credentials – from your email service provider.

5. Run the Development Server
bash
Copy
Edit
npm run dev
App will be available at: http://localhost:9002

🌍 Deployment
MailBuddy is ready to deploy on Vercel:

Push your code to GitHub.

Import the repo into Vercel.

Set all the above Environment Variables in your Vercel project settings.

Deploy — you’ll get a live URL like https://mailbuddy.vercel.app.

📜 License
This project is licensed under the MIT License — see the LICENSE file for details.

⚠ Security Note
Never commit your .env file or share real credentials publicly.
Anyone running MailBuddy will need to create their own Firebase, Gemini, and SMTP accounts to get their own keys.


