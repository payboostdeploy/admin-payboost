import { useState } from "react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { LuLayoutGrid, LuCircleDollarSign } from "react-icons/lu";

import { useWindowWidth } from "@react-hook/window-size";
import { Link } from "react-router-dom";

const Button = ({ onClick, children, className }) => (
  <button onClick={onClick} className={`p-2 ${className}`}>
    {children}
  </button>
);

const Nav = ({ isCollapsed, links, toggleSidebar }) => (
  <nav
    className={`relative flex flex-col ${isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
  >
    <div className="flex justify-end p-2">
      <Button onClick={toggleSidebar} className="rounded-full bg-gray-200 mr-2">
        {isCollapsed ? (
          <FaChevronRight size={20} />
        ) : (
          <FaChevronLeft size={20} />
        )}
      </Button>
    </div>
    {links.map((link, index) => (
      <Link
        key={index}
        to={link.href}
        className="flex items-center p-4 hover:text-black hover:bg-gray-200"
      >
        <link.icon className="mr-2" size={24} />
        {!isCollapsed && <span>{link.title}</span>}
      </Link>
    ))}
  </nav>
);

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const onlyWidth = useWindowWidth();
  const mobileWidth = onlyWidth < 768;

  function toggleSidebar() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <>
      {mobileWidth ? null : (
        <div
          className={`relative flex min-h-screen${isCollapsed ? "w-16" : "w-64"
            } transition-all duration-300`}
        >
          <div className="flex flex-col border-r h-full px-3 pb-10 pt-6">
            <Nav
              isCollapsed={isCollapsed}
              links={[
                {
                  title: "Dashboard",
                  href: "/",
                  icon: LuLayoutGrid,
                },
                {
                  title: "Transactions",
                  href: "/transactions",
                  icon: LuCircleDollarSign,
                },
              ]}
              toggleSidebar={toggleSidebar}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
