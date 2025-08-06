import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { Brain } from 'lucide-react';

interface RegisterProps {
  setUser: (user: User) => void;
}

export default function Register({ setUser }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!username || !password) {
      toast({
        title: "Invalid Input",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // MOBILE LOGIN FIX: Include session cookies
        body: JSON.stringify({
          username,
          password,
          email,
          companyName,
          industry,
          companySize,
          consultingFocus: ['business_consulting']
        }),
      });

      const data = await response.json();
      console.log('Registration response:', { status: response.status, data });
      
      if (response.ok && data.user) {
        // Mobile fix: Store user in localStorage first
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Then set in React state
        setUser(data.user);
        
        toast({
          title: "Account Created Successfully",
          description: `Welcome ${data.user.username}! Redirecting to platform...`,
        });
        
        // Mobile fix: Small delay then redirect
        setTimeout(() => {
          window.location.href = '/ml-platform';
        }, 1000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || `Server returned ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed", 
        description: error instanceof Error ? error.message : "INTERNAL_ERROR",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          </div>
          <p className="text-gray-600">Join the Rithm Associate platform</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Company Name (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Industry (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger>
                <SelectValue placeholder="Company Size (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (1-10 employees)</SelectItem>
                <SelectItem value="medium">Medium (11-100 employees)</SelectItem>
                <SelectItem value="large">Large (101-1000 employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleRegister} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
