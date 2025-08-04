import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserProgress, getUserLevel, getPointsToNextLevel, ACHIEVEMENTS, BADGES } from "@/lib/gamification";
import { Trophy, Target, Zap, Award, TrendingUp, Calendar } from "lucide-react";

interface ProgressDashboardProps {
  userProgress: UserProgress;
}

export default function ProgressDashboard({ userProgress }: ProgressDashboardProps) {
  const currentLevel = getUserLevel(userProgress.totalPoints);
  const pointsToNext = getPointsToNextLevel(userProgress.totalPoints);
  const levelProgress = currentLevel >= 10 ? 100 : ((userProgress.totalPoints - (currentLevel === 1 ? 0 : [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000][currentLevel - 1])) / ([100, 200, 300, 400, 500, 1000, 1500, 2000, 3000, 6000][currentLevel - 1] || 1)) * 100;

  const recentAchievements = userProgress.achievements
    .filter(a => a.unlocked)
    .sort((a, b) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime())
    .slice(0, 3);

  const categoryStats = {
    methodology: userProgress.achievements.filter(a => a.category === 'methodology' && a.unlocked).length,
    consistency: userProgress.achievements.filter(a => a.category === 'consistency' && a.unlocked).length,
    accuracy: userProgress.achievements.filter(a => a.category === 'accuracy' && a.unlocked).length,
    progress: userProgress.achievements.filter(a => a.category === 'progress' && a.unlocked).length
  };

  return (
    <div className="space-y-6">
      {/* Level and Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span>Level {currentLevel} Grazing Scientist</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{userProgress.totalPoints} points</span>
              {currentLevel < 10 && <span>{pointsToNext} to next level</span>}
            </div>
            <Progress value={levelProgress} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{userProgress.assessmentsCompleted}</div>
                <div className="text-xs text-muted-foreground">Assessments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{userProgress.streakDays}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{userProgress.achievements.filter(a => a.unlocked).length}</div>
                <div className="text-xs text-muted-foreground">Achievements</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                  <div className="text-xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </div>
                  <Badge variant="secondary">+{achievement.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Skill Development</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Methodology</span>
                <span className="text-sm text-muted-foreground">{categoryStats.methodology}/3</span>
              </div>
              <Progress value={(categoryStats.methodology / 3) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Consistency</span>
                <span className="text-sm text-muted-foreground">{categoryStats.consistency}/2</span>
              </div>
              <Progress value={(categoryStats.consistency / 2) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm text-muted-foreground">{categoryStats.accuracy}/2</span>
              </div>
              <Progress value={(categoryStats.accuracy / 2) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{categoryStats.progress}/3</span>
              </div>
              <Progress value={(categoryStats.progress / 3) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Challenges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Next Challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ACHIEVEMENTS
              .filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked)
              .slice(0, 3)
              .map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-2 rounded-lg border border-dashed">
                  <div className="text-xl opacity-50">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </div>
                  <Badge variant="outline">{achievement.points} pts</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips for Improvement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Tips for Better Sampling</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <span>Maintain consistent 5-foot steps for accurate spacing</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <span>Take photos from chest height looking straight down</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <span>Walk in straight lines across the paddock for best coverage</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <span>Complete assessments regularly to build expertise</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}