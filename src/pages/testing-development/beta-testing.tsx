import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  TestTube, Users, MessageSquare, BarChart3, Target, Clock,
  Star, TrendingUp, CheckCircle, AlertTriangle, FileText,
  Phone, Mail, MapPin, Calendar, Lightbulb, Zap, Award
} from "lucide-react";

interface BetaApplication {
  farmName: string;
  location: string;
  farmSize: number;
  livestockTypes: string[];
  experience: string;
  currentSystem: string;
  email: string;
  phone: string;
  motivation: string;
  goals: string[];
  communicationPrefs: {
    email: boolean;
    phone: boolean;
    weeklyCheckin: boolean;
    surveyReminders: boolean;
  };
  referralSource: string;
}

interface BetaStatus {
  id: number;
  userId: number;
  farmName: string;
  location: string;
  farmSize: number | null;
  livestockTypes: string[];
  experience: string;
  currentSystem: string | null;
  email: string;
  phone: string | null;
  motivation: string;
  goals: string[];
  status: string;
  cohort: string | null;
  startDate: string | null;
  endDate: string | null;
  appliedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  communicationPrefs: {
    email: boolean;
    phone: boolean;
    weeklyCheckin: boolean;
    surveyReminders: boolean;
  } | null;
  adminNotes: string | null;
  referralSource: string | null;
}

interface BetaFeedbackForm {
  type: string;
  category: string;
  toolId?: number;
  rating: number;
  title: string;
  description: string;
  deviceType: string;
  location: string;
}

export default function BetaTesting() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Application form state
  const [application, setApplication] = useState<BetaApplication>({
    farmName: "",
    location: "",
    farmSize: 0,
    livestockTypes: [],
    experience: "",
    currentSystem: "",
    email: "",
    phone: "",
    motivation: "",
    goals: [],
    communicationPrefs: {
      email: true,
      phone: false,
      weeklyCheckin: true,
      surveyReminders: true,
    },
    referralSource: "",
  });

  // Feedback form state
  const [feedback, setFeedback] = useState<BetaFeedbackForm>({
    type: "tool_feedback",
    category: "usability",
    rating: 5,
    title: "",
    description: "",
    deviceType: "mobile",
    location: "field",
  });

  // Query beta application status
  const { data: betaStatus, isLoading: statusLoading } = useQuery<BetaStatus | null>({
    queryKey: ["/api/beta/status"],
  });

  // Query beta metrics
  const { data: betaMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/beta/metrics"],
  });

  // Application mutation
  const applicationMutation = useMutation({
    mutationFn: (data: BetaApplication) => apiRequest("POST", "/api/beta/apply", data),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Thank you for applying to our beta program! We'll review your application and get back to you within 3-5 business days.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/beta/status"] });
    },
    onError: () => {
      toast({
        title: "Application Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: (data: BetaFeedbackForm) => apiRequest("POST", "/api/beta/feedback", data),
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! Your input helps us improve the platform.",
      });
      setFeedback({
        type: "tool_feedback",
        category: "usability",
        rating: 5,
        title: "",
        description: "",
        deviceType: "mobile",
        location: "field",
      });
    },
    onError: () => {
      toast({
        title: "Feedback Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLivestockTypeChange = (type: string, checked: boolean) => {
    setApplication(prev => ({
      ...prev,
      livestockTypes: checked 
        ? [...prev.livestockTypes, type]
        : prev.livestockTypes.filter(t => t !== type)
    }));
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    setApplication(prev => ({
      ...prev,
      goals: checked 
        ? [...prev.goals, goal]
        : prev.goals.filter(g => g !== goal)
    }));
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    applicationMutation.mutate(application);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    feedbackMutation.mutate(feedback);
  };

  const getBetaStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <TestTube className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold">Cadence Beta Testing Program</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join a select group of forward-thinking farmers to help shape the future of rotational grazing technology. 
          Get early access to cutting-edge features while contributing to agricultural innovation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Exclusive Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Be among the first to test new features and provide feedback that directly influences development.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Premium Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Get priority support and direct access to our development team for questions and guidance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Recognition</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Beta testers receive special recognition and lifetime benefits as founding members of our community.
            </p>
          </CardContent>
        </Card>
      </div>

      {betaStatus ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <span>Your beta application status:</span>
              <Badge className={getBetaStatusColor(betaStatus.status)}>
                {betaStatus.status.charAt(0).toUpperCase() + betaStatus.status.slice(1)}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="text-center">
          <Button 
            onClick={() => setActiveTab("apply")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply for Beta Access
          </Button>
        </div>
      )}
    </div>
  );

  const renderApplication = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Beta Program Application
          </CardTitle>
          <CardDescription>
            Tell us about your farm and grazing goals to help us match you with the right beta features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitApplication} className="space-y-6">
            {/* Farm Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Farm Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farmName">Farm Name *</Label>
                  <Input
                    id="farmName"
                    value={application.farmName}
                    onChange={(e) => setApplication(prev => ({ ...prev, farmName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location (City, State) *</Label>
                  <Input
                    id="location"
                    value={application.location}
                    onChange={(e) => setApplication(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="farmSize">Farm Size (acres) *</Label>
                <Input
                  id="farmSize"
                  type="number"
                  value={application.farmSize || ""}
                  onChange={(e) => setApplication(prev => ({ ...prev, farmSize: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label>Livestock Types *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Cattle", "Sheep", "Goats", "Horses", "Pigs", "Chickens"].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={application.livestockTypes.includes(type)}
                        onCheckedChange={(checked) => handleLivestockTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={type}>{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Grazing Experience *</Label>
                  <Select 
                    value={application.experience} 
                    onValueChange={(value) => setApplication(prev => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-10 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currentSystem">Current Grazing System</Label>
                  <Select 
                    value={application.currentSystem} 
                    onValueChange={(value) => setApplication(prev => ({ ...prev, currentSystem: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select current system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continuous">Continuous Grazing</SelectItem>
                      <SelectItem value="rotational">Rotational Grazing</SelectItem>
                      <SelectItem value="intensive">Intensive Rotational</SelectItem>
                      <SelectItem value="none">No Formal System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={application.email}
                    onChange={(e) => setApplication(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={application.phone}
                    onChange={(e) => setApplication(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Goals and Motivation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Goals & Motivation</h3>
              
              <div>
                <Label htmlFor="motivation">Why are you interested in rotational grazing technology? *</Label>
                <Textarea
                  id="motivation"
                  value={application.motivation}
                  onChange={(e) => setApplication(prev => ({ ...prev, motivation: e.target.value }))}
                  placeholder="Tell us what drives your interest in improving grazing management..."
                  required
                />
              </div>

              <div>
                <Label>Primary Goals (select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {[
                    "Improve pasture health",
                    "Increase livestock performance",
                    "Reduce feed costs",
                    "Environmental sustainability",
                    "Better farm organization",
                    "Data-driven decisions"
                  ].map(goal => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={application.goals.includes(goal)}
                        onCheckedChange={(checked) => handleGoalChange(goal, checked as boolean)}
                      />
                      <Label htmlFor={goal}>{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="referralSource">How did you hear about Cadence?</Label>
                <Input
                  id="referralSource"
                  value={application.referralSource}
                  onChange={(e) => setApplication(prev => ({ ...prev, referralSource: e.target.value }))}
                  placeholder="Social media, conference, word of mouth, etc."
                />
              </div>
            </div>

            <Separator />

            {/* Communication Preferences */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Communication Preferences</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailComm"
                    checked={application.communicationPrefs.email}
                    onCheckedChange={(checked) => 
                      setApplication(prev => ({ 
                        ...prev, 
                        communicationPrefs: { ...prev.communicationPrefs, email: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="emailComm">Email updates about beta program</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="phoneComm"
                    checked={application.communicationPrefs.phone}
                    onCheckedChange={(checked) => 
                      setApplication(prev => ({ 
                        ...prev, 
                        communicationPrefs: { ...prev.communicationPrefs, phone: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="phoneComm">Phone calls for important updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weeklyCheckin"
                    checked={application.communicationPrefs.weeklyCheckin}
                    onCheckedChange={(checked) => 
                      setApplication(prev => ({ 
                        ...prev, 
                        communicationPrefs: { ...prev.communicationPrefs, weeklyCheckin: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="weeklyCheckin">Weekly check-in calls</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="surveyReminders"
                    checked={application.communicationPrefs.surveyReminders}
                    onCheckedChange={(checked) => 
                      setApplication(prev => ({ 
                        ...prev, 
                        communicationPrefs: { ...prev.communicationPrefs, surveyReminders: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="surveyReminders">Survey and feedback reminders</Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={applicationMutation.isPending}
            >
              {applicationMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeedback = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Beta Feedback
          </CardTitle>
          <CardDescription>
            Your feedback helps us improve Cadence. Share your experience, report bugs, or suggest features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitFeedback} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedbackType">Feedback Type</Label>
                <Select 
                  value={feedback.type} 
                  onValueChange={(value) => setFeedback(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tool_feedback">Tool Feedback</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="weekly_checkin">Weekly Check-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={feedback.category} 
                  onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usability">Usability</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="rating">Overall Rating (1-5 stars)</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    className={`w-8 h-8 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={feedback.title}
                onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your feedback"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={feedback.description}
                onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of your feedback, bug, or feature request..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <Select 
                  value={feedback.deviceType} 
                  onValueChange={(value) => setFeedback(prev => ({ ...prev, deviceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile Phone</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="desktop">Desktop/Laptop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Where were you using the app?</Label>
                <Select 
                  value={feedback.location} 
                  onValueChange={(value) => setFeedback(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">In the field</SelectItem>
                    <SelectItem value="office">Office/Home</SelectItem>
                    <SelectItem value="barn">Barn/Facility</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="apply">
          {renderApplication()}
        </TabsContent>

        <TabsContent value="feedback">
          {renderFeedback()}
        </TabsContent>
      </Tabs>
    </div>
  );
}