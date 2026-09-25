# 📚 StudyHub Cloud

> A cloud-based study material management and sharing platform designed to help students organize, store, and share academic resources in one place.

## 📌 About the Project

**StudyHub Cloud** is a student-focused web application created to solve the problem of scattered and poorly organized study material.

Students often keep their notes, PPTs, reports, question banks, and educational resources in different folders, messaging applications, cloud drives, and devices. Finding a particular resource later can become difficult and time-consuming.

StudyHub Cloud provides a **centralized platform** where academic resources can be organized section-wise, folder-wise, and topic-wise, making them easier to access, manage, and share.

### Main Study Sections

The platform is designed to organize study resources into the following major categories:

- 📖 **Notes**
- 🎥 **Video Links**
- ❓ **Question Banks**
- 📄 **Reports**
- 📊 **PPTs**

Each section can contain folders for different subjects, chapters, or topics.

---

# 🎯 Problem Statement

Students commonly face problems such as:

- Study material being scattered across different platforms
- Difficulty finding old notes and resources
- Lack of proper folder-wise organization
- Repeatedly sending the same files to classmates
- Difficulty sharing only a specific portion of study material
- Managing files stored across multiple devices

StudyHub Cloud aims to provide a single platform where these resources can be organized and shared more efficiently.

---

# 💡 Proposed Solution

StudyHub Cloud follows a simple structure:

```text
One Platform
     ↓
Study Sections
     ↓
Folders
     ↓
Topics / Chapters
     ↓
Study Resources
     ↓
Shareable Links
```

This allows users to keep academic resources organized while also making selected resources easy to share with other students.

---

# ✨ Key Features

## 🔐 Authentication

- User authentication through Appwrite
- Account-based access to resources
- Protected application functionality
- User-specific resource management

## 📂 Folder-Based Organization

Study material can be organized into:

```text
Section
   └── Folder
        └── Chapter / Topic
             └── Resources
```

This structure makes academic resources easier to locate and manage.

## 📤 File Management

- Upload study materials
- Store resource information
- Organize files into folders
- Manage uploaded resources
- Maintain resource metadata

## 🔗 Sharing

StudyHub Cloud is designed to allow users to share specific resources or folders through shareable links.

Instead of sharing an entire collection of study material, users can share only the required content.

## ☁️ Cloud Storage

The project uses cloud-based infrastructure for storing and managing application resources.

The architecture separates:

- Application logic
- Database information
- Authentication
- File storage

---

# 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │      Student      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ StudyHub Frontend │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Backend / API   │
                    │ Node.js + Express │
                    └───────┬─────┬─────┘
                            │     │
                ┌───────────┘     └───────────┐
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │     Appwrite    │           │    AWS S3       │
       │ Authentication  │           │  Cloud Storage  │
       └─────────────────┘           └─────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │     Database    │
                    │  Appwrite DB / │
                    │     TablesDB   │
                    └─────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3

## Backend

- Node.js
- Express.js
- REST APIs

## Database

- Appwrite TablesDB
- MongoDB / MongoDB Atlas where applicable

## Authentication

- Appwrite Authentication

## Cloud Storage

- Amazon S3

## Deployment

- Vercel
- Railway
- AWS services

---

# 📁 Project Structure

```text
My studyhub web/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── docs/
│   └── premium-appwrite-setup.md
│
└── README.md
```

---

# 📚 Core Data Structure

The current Appwrite project contains tables for major application resources.

```text
Appwrite Database
│
├── Notes
├── Shares
├── premiumContent
├── premiumStars
├── payment
└── Folders
```

These tables support different parts of the StudyHub application such as study resources, folders, sharing, premium content, and related application data.

---

# 🔄 Application Workflow

```text
User
  ↓
Login / Authentication
  ↓
StudyHub Dashboard
  ↓
Select Study Section
  ↓
Open Folder / Topic
  ↓
Upload / View / Manage Resource
  ↓
Store Resource Information
  ↓
Share Selected Resource / Folder
```

---

# 🔐 Authentication

StudyHub Cloud uses **Appwrite Authentication** for user account management.

The application first checks whether a user is authenticated before loading user-specific data.

Typical flow:

```text
User opens StudyHub
        ↓
Appwrite account.get()
        ↓
Authentication status checked
        ↓
User-specific data loaded
```

---

# 🗄️ Appwrite Database

The project is currently working with **Appwrite TablesDB**.

The application contains tables such as:

- `Notes`
- `Shares`
- `premiumContent`
- `premiumStars`
- `payment`
- `Folders`

The database identifier currently configured for the application is associated with the Appwrite project environment.

> Database IDs, API keys, and other sensitive credentials should never be committed to GitHub.

---

# ⚠️ Appwrite TablesDB Migration Note

During development, an important compatibility issue was identified.

The current Appwrite project uses the newer **TablesDB structure**, while some parts of the application code were previously using the older **Collections / Documents API**.

### Old API style

The application was attempting requests similar to:

```text
/databases/{databaseId}/collections/{collectionId}/documents
```

### TablesDB structure

The newer structure works with tables and rows, for example:

```text
/databases/{databaseId}/tables/{tableId}/rows
```

Because of this mismatch, requests to some old collection/document endpoints can return:

```text
404 Not Found
```

---

# 🐛 Current Appwrite Issue

During testing, the browser console showed requests returning `404`.

Examples included resources related to:

```text
profiles
premiumContent
premiumStars
```

### Important finding

The Appwrite project currently contains these tables:

```text
Notes
Shares
premiumContent
premiumStars
payment
Folders
```

but a `profiles` table was not present in the identified table list.

Therefore, the application must ensure that:

1. The correct Appwrite Database ID is being used.
2. The correct Table IDs are configured.
3. The frontend uses the **TablesDB API** for tables/rows.
4. Any references to the old Collections/Documents API are updated where required.
5. Required tables exist before the corresponding application features are used.

---

# 🔧 Appwrite API Migration

The migration from the older database API to TablesDB may require replacing database operations based on collections/documents with TablesDB operations based on tables/rows.

Conceptually:

```text
Old API

Collection
    ↓
Document
```

becomes:

```text
TablesDB

Table
    ↓
Row
```

The code should therefore use the appropriate TablesDB SDK methods for operations such as:

- Listing rows
- Getting a row
- Creating a row
- Updating a row
- Deleting a row

---

# 📖 Documentation

Additional Appwrite setup and configuration notes are available in:

```text
docs/premium-appwrite-setup.md
```

This documentation can be used while configuring or troubleshooting the Appwrite integration.

---

# ⚙️ Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/muditjain298/StudyHub-Cloud-NEW.git
cd StudyHub-Cloud-NEW
```

## 2. Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

## 3. Configure Environment Variables

Create the required environment files and configure the values for your local setup.

Typical configuration may include:

```env
MONGODB_URI=your_mongodb_connection_string

APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_appwrite_project_id
APPWRITE_DATABASE_ID=your_database_id

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket_name

FRONTEND_URL=your_frontend_url
BACKEND_URL=your_backend_url
```

> Never commit `.env` files or cloud credentials to the repository.

## 4. Start the Application

Start the backend and frontend according to the project configuration.

Example:

```bash
npm run dev
```

---

# 🔒 Security

The project follows basic security practices such as:

- Authentication before accessing protected functionality
- Environment variables for secrets
- User-specific resource handling
- Cloud-based storage
- Protected backend routes where applicable

Sensitive information such as:

```text
API Keys
AWS Secret Keys
Database Passwords
Appwrite Secrets
JWT / Tokens
```

must never be stored directly in source code or pushed to GitHub.

---

# 🚀 Deployment

The project is designed to use cloud services for deployment and storage.

A typical deployment architecture can include:

```text
Frontend
   ↓
Vercel

Backend
   ↓
Railway

Database / Authentication
   ↓
Appwrite

File Storage
   ↓
AWS S3
```

The exact deployment configuration may vary between development and production environments.

---

# 📸 Screenshots

Add screenshots of the application here.

Example:

```md
![StudyHub Dashboard](screenshots/dashboard.png)

![StudyHub Login](screenshots/login.png)

![StudyHub Folder View](screenshots/folder-view.png)
```

---

# 🎯 Project Goals

The main goals of StudyHub Cloud are:

- Centralize academic resources
- Improve study material organization
- Make resources easier to discover
- Simplify resource sharing
- Provide cloud-based access
- Create a scalable student-focused platform

---

# 🔮 Future Enhancements

Planned improvements can include:

- 🔎 Advanced search
- 👀 File preview
- 📱 Improved mobile experience
- 🔗 Advanced sharing permissions
- 🔔 Notifications
- 📊 Resource analytics
- 🤝 Collaboration features
- ⚡ Better performance and cloud optimization
- 🧠 Smarter resource discovery

---

# 📌 Project Status

🚧 **Under Active Development**

StudyHub Cloud is continuously being improved, with new features, UI changes, backend improvements, and cloud integrations being added during development.

---

# 👨‍💻 Author

## Mudit Jain

Engineering Student and Developer

GitHub:

https://github.com/muditjain298

---

# ⭐ Contributing

Suggestions, improvements, and bug reports are welcome as the project continues to evolve.

---

# 📜 License

This project is developed for educational and project purposes.