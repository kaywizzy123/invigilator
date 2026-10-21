import {
  CircleUserRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Form, Link, NavLink } from "react-router";
import ThemeToggle from "./ThemeToggle";

// NavLink knows whether its page is the one open, so the current page can be highlighted.
function navClass({ isActive }) {
  return `flex items-center gap-1.5 rounded-md px-2 py-1 ${
    isActive ? "bg-gray-100 text-gray-900" : "hover:text-gray-900"
  }`;
}

// A navbar link: always an icon; the words show from small-tablet width up.
// aria-label keeps the link's name for screen readers when the words are hidden.
function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={navClass} aria-label={label}>
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

export default function Navbar({ user }) {
  return (
    <nav className="flex items-center justify-between gap-4 border-b border-gray-200 bg-surface px-4 py-3 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        Invigilator
      </Link>
      {user ? (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 sm:gap-4">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          {user.role === "teacher" && <NavItem to="/classes" icon={Users} label="Classes" />}
          {user.role === "student" && <NavItem to="/progress" icon={TrendingUp} label="Progress" />}
          <NavItem to="/profile" icon={CircleUserRound} label={user.fullname} />
          <Form method="post" action="/logout">
            <button
              type="submit"
              aria-label="Log out"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:text-gray-900"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </Form>
          <ThemeToggle />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 sm:gap-4">
          <NavItem to="/login" icon={LogIn} label="Log in" />
          <NavItem to="/signup" icon={UserPlus} label="Sign up" />
          <ThemeToggle />
        </div>
      )}
    </nav>
  );
}
