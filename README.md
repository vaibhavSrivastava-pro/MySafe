````markdown
# 🔐 MySafeee - Secure File Transfer Platform

A secure file transfer solution enabling **encrypted file sharing** between desktop and mobile devices via **FTP**. MySafeee ensures your sensitive data remains protected during transfer and storage.

---

## 🚀 Features

- 🔒 End-to-end encryption with **AES-256-CBC**
- 💻📱 Cross-platform compatibility (**Web**, **iOS**, **Android**)
- 📤 FTP-based file transfer for reliable synchronization
- 🕒 Timestamp-based conflict resolution for file versions
- 📝 Intuitive file editor with real-time editing
- 🧾 Secure credential management with optional storage

---

## 📋 Prerequisites

- ⚙️ Node.js **16+**
- 🌐 FTP server access
- 📱 [Expo CLI](https://docs.expo.dev/get-started/installation/) (for mobile development)

---

## 🏗️ Architecture

The project consists of three main components:

### 🔧 Backend (`/Backend`)
An **Express.js** server providing:

- 🔌 FTP connection management  
- 🔐 File encryption/decryption APIs  
- 📤 File upload/download handling  
- ⚖️ Version conflict resolution  

### 🌐 Web Frontend (`/WebFrontend`)
A **React + TypeScript** application featuring:

- 🌐 FTP server connection interface  
- ✍️ Encrypted file editor  
- 🔁 Real-time file synchronization  
- 📱 Responsive design with **Chakra UI**  

### 📱 Mobile Frontend (`/MobileApp`)
A **React Native + Expo** application offering:

- 📂 Native file picker integration  
- 🔐 Secure credential storage  
- 📲 Cross-platform compatibility  
- 🖐️ Touch-optimized interface  

---

## 🛠️ Installation & Setup

### ⚙️ Backend Setup

```bash
cd Backend
npm install
npm start
# Server runs on http://localhost:3000
````

---

### 🌐 Web Frontend Setup

```bash
cd WebFrontend
npm install
npm run dev
# Web app runs on http://localhost:5173
```

---

### 📱 Mobile App Setup

```bash
cd MobileApp
npm install
npx expo start
# Follow Expo CLI instructions to run on device/simulator
```

---

## 📦 Usage Workflow

1. 🔗 **Connect**: Establish FTP server connection using your credentials
2. 📂 **Open**: Load encrypted files from local storage or FTP server
3. 📝 **Edit**: Modify file content in the built-in editor
4. 💾 **Save**: Encrypt and save files locally
5. ⬆️ **Upload**: Sync encrypted files to FTP server
6. 🔄 **Sync**: Automatic conflict resolution based on timestamps

```