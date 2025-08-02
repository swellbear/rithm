import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Mic, Upload, Play, Pause, FileAudio } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface SpeechResults {
  transcript: string;
  confidence: number;
  language: string;
  words: { word: string; confidence: number; startTime: number; endTime: number }[];
  speakerLabels: { speaker: number; from: number; to: number }[];
}

interface SpeechPanelProps {
  onAnalyzeSpeech: (audioFile: File) => Promise<SpeechResults>;
  speechResults?: SpeechResults;
  loading: boolean;
}

export default function SpeechPanel({ onAnalyzeSpeech, speechResults, loading }: SpeechPanelProps) {
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        setSelectedAudio(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('Audio file size must be less than 10MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    setSelectedAudio(file);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedAudio) {
      setError('Please select or record audio first');
      return;
    }

    try {
      setError(null);
      await onAnalyzeSpeech(selectedAudio);
    } catch (err) {
      setError('Failed to analyze audio. Please try again.');
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Speech Analysis
          </CardTitle>
          <CardDescription>
            Record or upload audio for speech-to-text transcription and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">or</div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              {selectedAudio ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <FileAudio className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{selectedAudio.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedAudio.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {selectedAudio && (
                    <div className="flex items-center justify-center gap-2">
                      <audio 
                        ref={audioRef}
                        src={URL.createObjectURL(selectedAudio)}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleAudioPlayback}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAudio(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileAudio className="mr-2 h-4 w-4" />
                      Upload Audio File
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    MP3, WAV, M4A up to 10MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleAnalyze} 
            disabled={loading || !selectedAudio}
            className="w-full"
          >
            {loading ? 'Transcribing...' : 'Analyze Speech'}
          </Button>
        </CardContent>
      </Card>

      {(loading || speechResults) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Speech Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : speechResults ? (
              <>
                {/* Main Transcript */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Transcript</h4>
                    <Badge className={getConfidenceColor(speechResults.confidence)}>
                      {Math.round(speechResults.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-sm leading-relaxed">{speechResults.transcript}</p>
                  </div>
                </div>

                {/* Language Detection */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detected Language</h4>
                  <Badge variant="outline">
                    {speechResults.language}
                  </Badge>
                </div>

                {/* Word-level Confidence */}
                {speechResults.words && speechResults.words.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Word Analysis</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {speechResults.words.map((word, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{word.startTime.toFixed(1)}s</span>
                            <span>{word.word}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(word.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaker Diarization */}
                {speechResults.speakerLabels && speechResults.speakerLabels.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Speaker Timeline</h4>
                    <div className="space-y-1">
                      {speechResults.speakerLabels.map((speaker, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">Speaker {speaker.speaker}</Badge>
                          <span className="text-gray-500">
                            {speaker.from.toFixed(1)}s - {speaker.to.toFixed(1)}s
                          </span>
                          <div className="flex-1">
                            <Progress 
                              value={(speaker.to - speaker.from) / speechResults.speakerLabels.reduce((max, s) => Math.max(max, s.to), 0) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}