import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Search, Download, Filter, BarChart3, Calendar, User, Activity, Shield, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Zap } from "lucide-react";
import type { BioimpedanceSession, BioimpedanceMeasurement } from "@shared/bioimpedance-schema";

interface SessionWithMeasurements extends BioimpedanceSession {
  measurements: BioimpedanceMeasurement[];
}

interface FilterState {
  sessionType: string;
  species: string;
  breed: string;
  healthStatus: string;
  dataReviewStatus: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

export default function RithmDataDisplay() {
  const [filters, setFilters] = useState<FilterState>({
    sessionType: "all",
    species: "all",
    breed: "all",
    healthStatus: "all",
    dataReviewStatus: "all",
    startDate: "",
    endDate: "",
    searchTerm: ""
  });

  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Fetch all bioimpedance sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['/api/bioimpedance-sessions'],
  });

  // Fetch measurements for expanded session
  const { data: measurements = [] } = useQuery({
    queryKey: [`/api/bioimpedance-sessions/${expandedSession}/measurements`],
    enabled: expandedSession !== null,
  });

  // Filter sessions based on filter criteria
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return (sessions as any).filter((session: BioimpedanceSession) => {
      // Session type filter
      if (filters.sessionType && filters.sessionType !== "all" && session.sessionType !== filters.sessionType) return false;
      
      // Species filter
      if (filters.species && filters.species !== "all" && session.species !== filters.species) return false;
      
      // Breed filter
      if (filters.breed && filters.breed !== "all" && session.breed !== filters.breed) return false;
      
      // Health status filter
      if (filters.healthStatus && filters.healthStatus !== "all" && session.healthStatus !== filters.healthStatus) return false;
      
      // Data review status filter
      if (filters.dataReviewStatus && filters.dataReviewStatus !== "all" && session.dataReviewStatus !== filters.dataReviewStatus) return false;
      
      // Date range filter
      if (filters.startDate) {
        const sessionDate = new Date(session.createdAt);
        const startDate = new Date(filters.startDate);
        if (sessionDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const sessionDate = new Date(session.createdAt);
        const endDate = new Date(filters.endDate);
        if (sessionDate > endDate) return false;
      }
      
      // Search term filter (searches across multiple fields)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableFields = [
          session.subjectName,
          session.subjectId,
          session.notes,
          session.equipmentModel,
          session.researchSite
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) return false;
      }
      
      return true;
    });
  }, [sessions, filters]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof BioimpedanceSession) => {
    if (!sessions) return [];
    return Array.from(new Set((sessions as any).map((s: BioimpedanceSession) => s[field]).filter(Boolean)));
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sessionType: "all",
      species: "all",
      breed: "all",
      healthStatus: "all",
      dataReviewStatus: "all",
      startDate: "",
      endDate: "",
      searchTerm: ""
    });
  };

  const exportData = () => {
    // Convert filtered sessions to CSV format
    const csvHeaders = [
      'ID', 'Date', 'Session Type', 'Subject Name', 'Species', 'Breed', 
      'Age', 'Weight', 'Height', 'Health Status', 'Equipment', 'Review Status'
    ].join(',');
    
    const csvData = filteredSessions.map((session: BioimpedanceSession) => [
      session.id,
      format(new Date(session.createdAt), 'yyyy-MM-dd HH:mm'),
      session.sessionType,
      session.subjectName || '',
      session.species || '',
      session.breed || '',
      session.age ? `${session.age} ${session.ageUnit || ''}` : '',
      session.weight ? `${session.weight} ${session.weightUnit || 'kg'}` : '',
      session.height ? `${session.height} ${session.heightUnit || 'cm'}` : '',
      session.healthStatus || '',
      session.equipmentModel || '',
      session.dataReviewStatus || ''
    ].join(',')).join('\n');

    const csv = `${csvHeaders}\n${csvData}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rithm-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeColor = (status: string | null) => {
    if (!status) return "secondary";
    switch (status.toLowerCase()) {
      case "approved": return "default";
      case "reviewed": return "secondary";
      case "pending": return "destructive";
      case "flagged": return "destructive";
      case "healthy": return "default";
      case "sick": return "destructive";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Loading research data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Data Loading Error</CardTitle>
            <CardDescription>Unable to load research data. Please try again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-3 max-w-7xl">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Link href="/rithm">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Testing
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Rithm Research Data
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comprehensive bioimpedance field testing data with advanced filtering
                </p>
              </div>
            </div>
            <Button onClick={exportData} size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Compact Filters Panel */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Data Filters
            </CardTitle>
            <CardDescription className="text-sm">
              Filter and search through {(sessions as any).length} research sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search subjects, notes..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Session Type */}
              <div>
                <Label htmlFor="sessionType" className="text-sm">Session Type</Label>
                <Select value={filters.sessionType} onValueChange={(value) => handleFilterChange('sessionType', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {getUniqueValues('sessionType').map((type) => (
                      <SelectItem key={type as string} value={type as string}>{type as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Species */}
              <div>
                <Label htmlFor="species" className="text-sm">Species</Label>
                <Select value={filters.species} onValueChange={(value) => handleFilterChange('species', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All species</SelectItem>
                    {getUniqueValues('species').map((species) => (
                      <SelectItem key={species as string} value={species as string}>{species as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breed */}
              <div>
                <Label htmlFor="breed" className="text-sm">Breed</Label>
                <Select value={filters.breed} onValueChange={(value) => handleFilterChange('breed', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All breeds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All breeds</SelectItem>
                    {getUniqueValues('breed').map((breed) => (
                      <SelectItem key={breed as string} value={breed as string}>{breed as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Health Status */}
              <div>
                <Label htmlFor="healthStatus" className="text-sm">Health Status</Label>
                <Select value={filters.healthStatus} onValueChange={(value) => handleFilterChange('healthStatus', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {getUniqueValues('healthStatus').map((status) => (
                      <SelectItem key={status as string} value={status as string}>{status as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Review Status */}
              <div>
                <Label htmlFor="dataReviewStatus" className="text-sm">Review Status</Label>
                <Select value={filters.dataReviewStatus} onValueChange={(value) => handleFilterChange('dataReviewStatus', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All reviews</SelectItem>
                    {getUniqueValues('dataReviewStatus').map((status) => (
                      <SelectItem key={status as string} value={status as string}>{status as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Showing {filteredSessions.length} of {(sessions as any).length} sessions
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Research Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-600 dark:text-gray-300">No sessions found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or clearing them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session: BioimpedanceSession) => (
                  <Card key={session.id} className="w-full">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <CardTitle className="text-lg flex items-center gap-3">
                            {session.species} - {session.subjectName || `Subject ${session.subjectId}`}
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {session.sessionType}
                            </Badge>
                          </CardTitle>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>
                              <p className="font-medium">{format(new Date(session.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span>
                              <p className="font-medium">{session.age ? `${session.age} ${session.ageUnit || ''}` : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Weight:</span>
                              <p className="font-medium">{session.weight ? `${session.weight} ${session.weightUnit || 'kg'}` : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Equipment:</span>
                              <p className="font-medium">{session.equipmentModel}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Breed:</span>
                              <p className="font-medium">{session.breed}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Badge variant={getStatusBadgeColor(session.healthStatus)} className="text-sm px-3 py-1">
                              {session.healthStatus || 'Unknown'}
                            </Badge>
                            <Badge variant={getStatusBadgeColor(session.dataReviewStatus)} className="text-sm px-3 py-1">
                              {session.dataReviewStatus || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                          className="min-w-[100px]"
                        >
                          {expandedSession === session.id ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {expandedSession === session.id && (
                      <CardContent className="pt-0 border-t bg-gray-50 dark:bg-gray-900">
                        <div className="space-y-6 py-6">
                          
                          {/* Subject Information */}
                          <div>
                            <h4 className="font-semibold text-lg mb-4 text-blue-600 dark:text-blue-400">Subject Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Subject ID</Label>
                                <p className="font-medium text-base mt-1">{session.subjectId}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Research Site</Label>
                                <p className="font-medium text-base mt-1">{session.researchSite}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Session Duration</Label>
                                <p className="font-medium text-base mt-1">{(session as any).sessionDuration} minutes</p>
                              </div>
                            </div>
                          </div>

                          {/* Environmental Conditions */}
                          <div>
                            <h4 className="font-semibold text-lg mb-4 text-green-600 dark:text-green-400">Environmental Conditions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Temperature</Label>
                                <p className="font-medium text-base mt-1">{(session as any).temperature}°C</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Humidity</Label>
                                <p className="font-medium text-base mt-1">{(session as any).humidity}%</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Electrode Contact</Label>
                                <p className="font-medium text-base mt-1">{(session as any).electrodeContact}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400">Equipment Serial</Label>
                                <p className="font-medium text-base mt-1">{session.equipmentSerial}</p>
                              </div>
                            </div>
                          </div>

                          {/* Bioimpedance Measurements */}
                          {(measurements as any).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-lg mb-4 text-purple-600 dark:text-purple-400">Multi-Frequency Bioimpedance Measurements</h4>
                              <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                                      <TableHead className="text-sm font-semibold py-3">Frequency</TableHead>
                                      <TableHead className="text-sm font-semibold py-3">Resistance (Ω)</TableHead>
                                      <TableHead className="text-sm font-semibold py-3">Reactance (Ω)</TableHead>
                                      <TableHead className="text-sm font-semibold py-3">Magnitude (Ω)</TableHead>
                                      <TableHead className="text-sm font-semibold py-3">Phase (°)</TableHead>
                                      <TableHead className="text-sm font-semibold py-3">Signal Quality</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(measurements as any).map((measurement: BioimpedanceMeasurement) => (
                                      <TableRow key={measurement.id}>
                                        <TableCell className="text-sm py-3 font-medium">{measurement.frequency}</TableCell>
                                        <TableCell className="text-sm py-3">{measurement.resistance}</TableCell>
                                        <TableCell className="text-sm py-3">{measurement.reactance}</TableCell>
                                        <TableCell className="text-sm py-3">{measurement.impedanceMagnitude}</TableCell>
                                        <TableCell className="text-sm py-3">{measurement.phaseAngle}</TableCell>
                                        <TableCell className="text-sm py-3">
                                          <Badge variant="outline" className="text-sm">
                                            {measurement.signalQuality || 'N/A'}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {session.notes && (
                            <div>
                              <h4 className="font-semibold text-lg mb-4 text-orange-600 dark:text-orange-400">Research Notes</h4>
                              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm">{session.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}