import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import AuthInitializer from "./components/AuthInitializer";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import RoleRoute from "./components/RoleRoute";
import Home from "./Pages/Home";
import Trips from "./Pages/Trips";
import TripDetails from "./Pages/TripDetails";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { ForgotPassword, ResetPassword } from "./Pages/AuthExtras";
import UserDashboard from "./Pages/UserDashboard";
import UserPosts from "./Pages/UserPosts";
import UserAnalytics from "./Pages/UserAnalytics";
import CreateTrip from "./Pages/CreateTrip";
import SavedTrips from "./Pages/SavedTrips";
import Bookings from "./Pages/Bookings";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";
import Chat from "./Pages/Chat";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminPosts from "./Pages/AdminPosts";
import AdminUsers from "./Pages/AdminUsers";
import AdminAnalytics from "./Pages/AdminAnalytics";
import AdminBookings from "./Pages/AdminBookings";
import AccountRestricted from "./Pages/AccountRestricted";

function Root() {
  const { loading } = useSelector((s) => s.auth);
  if (loading) return <div className="min-h-screen bg-[#08131f]" />;
  return <Home />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/explore" element={<Trips />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetails />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account-restricted" element={<AccountRestricted />} />
          </Route>

          <Route element={<RoleRoute roles={["USER", "SELLER"]} />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/my-trips" element={<UserPosts />} />
            <Route path="/analytics" element={<UserAnalytics />} />
            <Route path="/create-trip" element={<CreateTrip />} />
            <Route path="/edit-trip/:id" element={<CreateTrip />} />
            <Route path="/favorites" element={<SavedTrips />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<RoleRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AccountRestricted />
      </AuthInitializer>
    </BrowserRouter>
  );
}
