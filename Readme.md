# 📸 Instagram Clone - Full Stack Application

A complete Instagram clone built with **Next.js 14**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.

## ✨ Features

### 🔐 Authentication & Security
- User registration and login
- JWT token authentication
- Password reset functionality
- Email verification
- Secure file uploads

### 📱 Core Features
- **Posts**: Create, view, like, and comment on posts
- **Stories**: 24-hour temporary content with views
- **Real-time Messaging**: Private messages with Socket.IO
- **User Profiles**: Customizable profiles with follow system
- **Search**: Find users and content
- **Feed**: Personalized content feed
- **Explore**: Discover new content

### 🎨 UI/UX
- Responsive design (mobile-first)
- Dark/Light mode toggle
- Instagram-like interface
- Real-time notifications
- Smooth animations

### 🚀 Technical Features
- Server-side rendering with Next.js 14
- Real-time communication with Socket.IO
- File upload with Cloudinary integration
- MongoDB with optimized queries
- RESTful API architecture
- TypeScript support

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication
- **React Query** - Data fetching and caching
- **Zustand** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Cloudinary** - Media storage
- **Multer** - File uploads

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running (locally or MongoDB Atlas)
- Git installed

### 1️⃣ Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd glitchat

# Run the complete setup script
COMPLETE_SETUP.bat
```

### 2️⃣ Configure Environment Variables

#### Backend (.env in server-enhanced/)
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/instagram-clone

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Cloudinary (Optional - for production file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Optional - for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourapp.com
```

#### Frontend (.env.local in instagram-nextjs/)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3️⃣ Start the Application

```bash
# Option 1: Use the start script
START_SERVERS.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd server-enhanced
npm run dev

# Terminal 2 - Frontend
cd instagram-nextjs
npm run dev
```

### 4️⃣ Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 📖 Usage Guide

### First Time Setup
1. Open http://localhost:3000
2. Click "Sign up" to create an account
3. Fill in your details and register
4. You'll be automatically logged in

### Creating Your First Post
1. Click the "+" icon in the navigation
2. Upload an image or video
3. Add a caption
4. Click "Share" to post

### Following Users
1. Use the search bar to find users
2. Click on their profile
3. Click "Follow" to follow them
4. Their posts will appear in your feed

## 🏗 Project Structure

```
glitchat/
├── server-enhanced/           # Backend (Node.js/Express)
│   ├── controllers/          # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── socket/             # Socket.IO handlers
│   ├── utils/              # Utility functions
│   └── index.js            # Server entry point
│
├── instagram-nextjs/         # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
│
└── docs/                    # Documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:username/follow` - Follow/Unfollow user
- `GET /api/users/search` - Search users

### Posts
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/explore` - Get explore posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/Unlike post
- `POST /api/posts/:id/comments` - Add comment

### Stories
- `GET /api/stories/feed` - Get stories feed
- `POST /api/stories` - Create new story
- `POST /api/stories/:id/view` - View story

### Messages
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages/send` - Send message
- `POST /api/messages/read` - Mark as read

## 🔄 Real-time Features

The app uses Socket.IO for real-time features:
- Live messaging
- Real-time notifications
- Story views
- Online status
- Typing indicators

## 🧪 Testing

```bash
# Backend tests (if implemented)
cd server-enhanced
npm test

# Frontend tests (if implemented)
cd instagram-nextjs
npm test
```

## 🚀 Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)
1. Set up environment variables on your platform
2. Update `MONGODB_URI` to use MongoDB Atlas
3. Configure Cloudinary for file uploads
4. Deploy using platform-specific methods

### Frontend Deployment (Vercel/Netlify)
1. Connect your repository
2. Set environment variables
3. Deploy automatically on git push

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas connection string
```

**Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /PID <process-id> /F
```

**Environment Variables Not Loading**
- Ensure `.env` files are in the correct directories
- Restart servers after changing environment variables
- Check for typos in variable names

### Debug Mode
```bash
# Backend debug
cd server-enhanced
DEBUG=* npm run dev

# Frontend debug (check browser console)
cd instagram-nextjs
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Instagram for design inspiration
- Next.js team for the amazing framework
- All open-source contributors

## 📞 Support

- Create an issue for bugs
- Join our Discord community (coming soon)
- Check the documentation for common solutions

---

**Made with ❤️ by [Your Name]**