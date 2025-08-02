import { Leaf, Settings, LogOut, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SimpleHeader() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
    } catch (error) {
      console.error("Logout failed:", error);
      logout(); // Logout anyway
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Leaf className="h-8 w-8 text-green-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Rithm
          </span>
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-3 py-2 text-sm">
              <div className="font-medium">{user?.farmName || user?.username}</div>
              <div className="text-gray-500 text-xs">Farm Manager</div>
            </div>
            <DropdownMenuItem onClick={() => navigate("/tools")}>
              <Wrench className="mr-2 h-4 w-4" />
              Farm Tools
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}