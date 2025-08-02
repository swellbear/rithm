import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import CadenceLogo from "@/components/graze-flow-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const { toast } = useToast();

  // Account deletion mutation
  const accountDeleteMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      // First login to get authentication, then delete
      const loginResponse = await apiRequest("POST", "/api/auth/login", { username, password });
      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        // Now delete the account using the established session
        return await apiRequest("DELETE", "/api/auth/account", { password });
      } else {
        throw new Error("Invalid credentials");
      }
    },
    onSuccess: () => {
      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      setShowDeleteDialog(false);
      setDeleteUsername("");
      setDeletePassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (!deleteUsername.trim() || !deletePassword.trim()) {
      toast({
        title: "Fields Required",
        description: "Please enter both username and password to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    accountDeleteMutation.mutate({ username: deleteUsername, password: deletePassword });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-green-900 flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Compact header with logo */}
      <div className="w-full max-w-md mb-4 sm:mb-6 text-center">
        <div className="flex justify-center mb-1 sm:mb-2">
          <CadenceLogo size={48} showText={true} className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium">
          Farm Management Platform
        </p>
      </div>

      {/* Authentication forms */}
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            onSuccess={onAuthSuccess}
            onToggleMode={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onToggleMode={() => setIsLogin(true)}
          />
        )}
      </div>

      {/* Account deletion option - always accessible */}
      <div className="w-full max-w-md mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                <DialogDescription>
                  This will permanently delete your account and all associated data. 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium mb-1">What will be deleted:</p>
                      <ul className="text-xs text-red-700 space-y-0.5">
                        <li>• User account and login credentials</li>
                        <li>• All farm data (herds, paddocks, assessments)</li>
                        <li>• Tool preferences and settings</li>
                        <li>• Performance metrics and history</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="delete-username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="delete-username"
                    type="text"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="delete-password-auth" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="delete-password-auth"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteUsername("");
                    setDeletePassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={accountDeleteMutation.isPending || !deleteUsername.trim() || !deletePassword.trim()}
                >
                  {accountDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account Permanently"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Need to delete your account? Access available here even during setup.
          </p>
        </div>
      </div>
    </div>
  );
}