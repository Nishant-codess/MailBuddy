# 🌟 **MailBuddy** – _AI-Powered Email Campaign Builder_  

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)  
**MailBuddy** is your smart AI assistant for creating, personalizing, and sending email campaigns 🚀.  
With **Google Gemini AI** at its core, it crafts engaging content, analyzes customer data, and helps you connect with your audience in style.  

<p align="center">
  <img src="[https://drive.google.com/file/d/1n4SZmMdEMvO2bBmjdiuHPEfwp_JlzbHd/view?usp=sharing](https://drive.google.com/uc?export=view&id=1n4SZmMdEMvO2bBmjdiuHPEfwp_JlzbHd
)" alt="MailBuddy Dashboard">
  <br>
  <i>✨ AI-generated campaigns directly from your dashboard ✨</i>
</p>

---

## 💡 **Features at a Glance**
- 🤖 **AI Campaign Generation** – Create subject lines & email bodies from a single prompt.  
- 📊 **Customer Insights** – Upload CSVs & get AI-powered summaries.  
- 🎯 **Personalized Emails** – Every recipient gets a unique touch.  
- 🗓 **Scheduled Sending** – Send emails at the perfect time.  
- 📈 **Live Open Tracking** – Track engagement in real-time.  
- 🔐 **Secure Authentication** – Firebase-powered login system.  
- 🎨 **Beautiful UI** – ShadCN UI + Tailwind CSS for modern, responsive design.  

---

## 🛠 **Tech Stack**
| Category         | Technology |
|------------------|------------|
| **Frontend**     | [Next.js](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/) |
| **Backend**      | [Firebase](https://firebase.google.com/) (Firestore, Auth) |
| **AI Engine**    | [Google Gemini API](https://ai.google.dev) |
| **UI Library**   | [ShadCN UI](https://ui.shadcn.com/) |
| **Styling**      | [Tailwind CSS](https://tailwindcss.com/) |
| **Email Sending**| [Nodemailer](https://nodemailer.com/) via SMTP |
| **Hosting**      | [Vercel](https://vercel.com/) |

---

## 🚀 **Getting Started**

### **1️⃣ Prerequisites**
Make sure you have:  
- 📦 **Node.js** (v18+)  
- 🔥 A **Firebase Project** ([Create one](https://console.firebase.google.com/))  
- 🤖 **Gemini API Key** ([Get it here](https://aistudio.google.com/))  
- 📧 SMTP credentials (Gmail, SendGrid, Mailgun, etc.)  

---

### **2️⃣ Clone the Repository**
```bash
git clone https://github.com/your-username/mailbuddy.git
cd mailbuddy

Alright — continuing from **Step 3** in the same stylish format we used for your MailBuddy README:

---

````

### **3️⃣ Set Up Environment Variables**

Before running MailBuddy, you’ll need to configure your own environment variables.  
We keep these in a `.env` file to store sensitive credentials securely.


📁 **Create your `.env` file**:  
```bash
cp .env.example .env



📝 **Edit the `.env` file** with your own keys.
Here’s what you need:

#### 🔹 **Public Firebase Config** (Found in your Firebase Console → Project Settings → General → Your apps → SDK setup & configuration)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 🔹 **Private Firebase Admin Credentials**

(Create a Service Account in Firebase Console → Project Settings → Service accounts → Generate new private key)

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key_here"
```

> ⚠️ **Important:** Keep these safe! Do **not** commit them to GitHub.

#### 🔹 **Gemini AI Key** (From Google AI Studio)

```env
GEMINI_API_KEY=your_gemini_api_key
```

#### 🔹 **SMTP Credentials** (For sending emails — use Gmail, SendGrid, Mailgun, etc.)

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

#### 🔹 **Application URL**

For development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

For production (Vercel URL or custom domain):

```env
NEXT_PUBLIC_APP_URL=https://your-deployed-domain.com
```

---

### **4️⃣ Run MailBuddy Locally**

🚀 Start the development server:

```bash
npm run dev
```

Your app will be live at: **[http://localhost:9002](http://localhost:9002)**

---

### **5️⃣ Deploy to Vercel**

1. Push your project to GitHub.
2. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
3. Add all the `.env` variables in **Vercel → Project Settings → Environment Variables**.
4. Click **Deploy** and you’re live! 🎉

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 💌 Author & Credits

**MailBuddy** was built with ❤️ using:

* **[Next.js](https://nextjs.org/)**
* **[Firebase](https://firebase.google.com/)**
* **[Gemini AI](https://deepmind.google/technologies/gemini/)**
* **[ShadCN UI](https://ui.shadcn.com/)**
* **[Tailwind CSS](https://tailwindcss.com/)**

👨‍💻 Developed by: **Nishant Ranjan**
📧 Contact: [nishantranjan.air1@gmail.com](mailto:nishantranjan.air1@gmail.com)
🌟 If you like this project, give it a ⭐ on GitHub!


