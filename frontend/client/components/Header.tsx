import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileImage, User, LogOut } from "lucide-react";
import { RequireAdmin } from "./auth/RequireAdmin";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({ user, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="w-full bg-card/95 backdrop-blur border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden bg-white border border-border">
            <img
              src="/favicon.ico"
              alt="Ann Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              <Link to={"/"} style={{ cursor: "pointer" }}>
                Ann
              </Link>
            </h1>
            <p className="text-xs text-muted-foreground">
              Scientific Imaging Workspace
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-medical-blue text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <RequireAdmin>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </RequireAdmin>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={onLogin}
              className="bg-medical-blue hover:bg-medical-blue/90"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
