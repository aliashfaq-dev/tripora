 🌍 Tripora

> A modern travel and trip-sharing platform for discovering, creating, managing, and booking trips.

Tripora is a full-stack travel platform designed to connect travelers through trip discovery, trip creation, bookings, messaging, notifications, favorites, and profile management.

The platform provides separate experiences for regular users and administrators, with a clean and responsive interface.

---

 ✨ Features

 🧳 Trip Discovery
- Browse available travel trips
- View complete trip details
- Destination-based trip discovery
- Departure and return dates
- Seat availability
- Trip pricing
- Trip images and galleries
- Trip status management

 📝 Create & Manage Trips
Users can:
- Create new trips
- Save trip drafts
- Edit their trips
- Deactivate trips
- Reactivate inactive trips
- Permanently delete their own trips
- Upload trip images
- Manage trip availability

 ❤️ Favorites
- Add trips to favorites
- Remove trips from favorites
- View saved/favorite trips

 📅 Booking System
Tripora supports a complete booking workflow:

- Submit booking requests
- View bookings made by the user
- View bookings received for owned trips
- Accept booking requests
- Reject booking requests
- Cancel bookings
- Track booking status

Booking sections are separated into:

- **Bookings You Made**
- **Bookings You Received**

 💬 Real-Time Messaging
Users can communicate about trips through chat.

Features include:
- Person-to-person messaging
- Trip-specific conversations
- Message sending
- Read status
- Blocking/unblocking users
- Failed-delivery state for blocked conversations

 🔔 Notifications
Tripora provides notifications for important activity, including:

- New booking requests
- Booking acceptance
- Booking rejection
- Booking cancellation
- Post/trip interactions
- Other account activity

 👤 Profile Management
Users can manage:

- Name
- Phone number
- Profile photo
- Phone visibility settings

Profile images are uploaded through the backend image upload service and the resulting URL is stored with the user's profile.

 🛡️ Admin Panel
Administrators can manage platform content and users.

Admin functionality includes:
- Trip management
- Trip suspension
- Trip reactivation
- User moderation
- Suspended trip management

 🔐 Authentication
Protected API resources use Bearer token authentication.

The application supports:
- User authentication
- Protected routes
- Access-token authorization
- Session handling
- USER and ADMIN roles

> Tripora uses only two system roles: `USER` and `ADMIN`.

---

🎨 UI & UX

Tripora is designed with a modern responsive interface.

Highlights include:

- Responsive layouts
- Light and dark themes
- Mobile-friendly design
- Toast notifications
- Professional confirmation dialogs
- Clean trip cards
- Responsive chat interface
- User-friendly booking management
- Profile image previews

---

🏗️ Tech Stack

 Frontend

- React
- Vite
- JavaScript / JSX
- Tailwind CSS
- Axios
- React Router
- Socket-based real-time communication

Backend

Tripora communicates with a REST API backend.

Default deployed API:


https://trip-maker-backend.vercel.app/api/v1
