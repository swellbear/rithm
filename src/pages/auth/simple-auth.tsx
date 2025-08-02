import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SimpleAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const authMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; isLogin: boolean }) => {
      const endpoint = data.isLogin ? "/api/auth/login" : "/api/auth/register";
      return await apiRequest("POST", endpoint, { 
        username: data.username, 
        password: data.password 
      });
    },
    onSuccess: () => {
      // Invalidate auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: any) => {
      setError(error.message || "Authentication failed");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    authMutation.mutate({ username, password, isLogin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cadence</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Intelligent Grazing Management
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Welcome Back" : "Get Started"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Farm Name or Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your farm name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={authMutation.isPending}
              >
                {authMutation.isPending ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Smart grazing management for sustainable farming
        </div>
      </div>
    </div>
  );
}