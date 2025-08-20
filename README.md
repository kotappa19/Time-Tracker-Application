# TimeTracker - Professional Time Management Application

A comprehensive Next.js-based time tracking application designed for organizations to manage employee productivity, project timelines, and task accountability. Built with Firebase for authentication and data storage.

## 🚀 Features

### Core Features
- **User Authentication** - Secure login/signup with Firebase Auth
- **Project Management** - Create, edit, and manage projects with status tracking
- **Task Management** - Comprehensive task system with priorities, due dates, and status tracking
- **Time Tracking** - Real-time timer with manual entry capabilities
- **Dashboard & Reports** - Analytics and insights with interactive charts

### Key Capabilities
- **Real-time Timer** - Start/stop timer with automatic time calculation
- **Manual Time Entry** - Add time entries manually for past work
- **Project Organization** - Group tasks by projects with status management
- **Task Filtering** - Search and filter tasks by status, project, and keywords
- **Analytics Dashboard** - Visual reports with charts and productivity insights
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 Prerequisites

Before running this application, you need:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn**
3. **Firebase Project** with Authentication and Firestore enabled

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd oris-hackathon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your Firebase configuration

### 4. Update Firebase Config

Replace the Firebase configuration in `src/lib/firebase.ts` with your actual Firebase project details:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 5. Firestore Security Rules

Set up Firestore security rules to allow authenticated users to access their data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.uid || 
         resource.data.userId == request.auth.uid || 
         resource.data.assignedTo == request.auth.uid);
    }
  }
}
```

### 6. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Sign Up** - Create a new account with email and password
2. **Create Projects** - Start by creating your first project
3. **Add Tasks** - Create tasks within your projects
4. **Track Time** - Use the timer or manual entry to log your work hours
5. **View Reports** - Analyze your productivity with the dashboard and reports

### Key Workflows

#### Project Management
- Create projects with descriptions and status
- Edit project details and status
- Delete projects when no longer needed

#### Task Management
- Create tasks with titles, descriptions, and priorities
- Assign tasks to projects
- Set due dates and track completion status
- Filter and search tasks

#### Time Tracking
- Start a timer for active work
- Stop timer to log completed work
- Add manual time entries for past work
- View recent time entries

#### Analytics
- View productivity summaries
- Analyze time distribution by project
- Track task completion rates
- Export data for further analysis

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── projects/          # Projects page
│   ├── tasks/             # Tasks page
│   ├── time-tracking/     # Time tracking page
│   ├── reports/           # Reports page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   ├── projects/         # Project management components
│   ├── tasks/            # Task management components
│   ├── time-tracking/    # Time tracking components
│   └── reports/          # Reports and analytics components
├── contexts/             # React contexts
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   └── firestore.ts      # Firestore service functions
└── types/                # TypeScript type definitions
```

## 🔒 Security Features

- **Authentication Required** - All routes require user authentication
- **Data Isolation** - Users can only access their own data
- **Input Validation** - Form validation and sanitization
- **Secure Firebase Rules** - Database-level security rules

## 📊 Performance Features

- **Real-time Updates** - Live timer and data synchronization
- **Optimistic Updates** - Immediate UI feedback
- **Lazy Loading** - Components load as needed
- **Responsive Design** - Optimized for all screen sizes

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add Firebase environment variables
4. Deploy automatically

### Environment Variables
Set these environment variables in your deployment platform:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ for professional time management and productivity tracking.**
