import React from "react";
import "./AppNavbar.scss";
import { SearchIcon, LogInIcon, ArrowDown } from "lucide-react";
import { mainNavs } from "@/constants/navs";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AppNavbar = () => {
  return (
    <div className="app-navbar">
      <Search />
      <div className="ac-navs">
        {mainNavs.map((nav: any) => (
          <NavLink
            to={nav.href}
            key={nav.name}
            className={({ isActive }) =>
              `ac-nav-item ${isActive ? "active" : ""}`
            }
          >
            {nav.name}
          </NavLink>
        ))}
      </div>
      <Profile />
    </div>
  );
};

export default AppNavbar;

const Search = () => {
  return (
    <div className="search-container">
      <SearchIcon size={16} className="sc-icon" />
      <input type="text" placeholder="Search" className="sc-input" />
      <LogInIcon size={16} className="sc-icon" />
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const userName = `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`;

  console.log("[AppNavbar] User:", user);
  return (
    <div className="an-profile">
      <div className="an-profile-image-container">
        <img
          src="/lovable-uploads/user-profile.png"
          alt="Profile"
          className="profile-image"
        />
      </div>

      <div className="an-profile-info">
        <h3 className="an-profile-name">{userName}</h3>
        <p className="an-profile-email">{user?.user_metadata?.email}</p>
      </div>
      <ArrowDown size={20} className="an-profile-icon" />
    </div>
  );
};
