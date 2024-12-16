import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { TaskManager } from '@/components/task-manager'
import { Integrations } from '@/components/integrations'
import { Notifications } from '@/components/notifications'
import { AIAgentStore } from '@/components/ai-agent-store'
import { AutomationInsights } from '@/components/automation-insights'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Twitter, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TaskClassification = {
  category: string
  confidence: number
  suggestedAction: string
  priority: 'high' | 'medium' | 'low'
  timeEstimate: string
}

export default function DashboardPage() {
  const [activePanel, setActivePanel] = useState('overview')
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review Unconf speaker list', completed: false, date: '2023-06-15', automated: false },
    { id: 2, title: 'Prepare Vitalik introduction', completed: true, date: '2023-06-10', automated: true },
    { id: 3, title: 'Update Unconf website', completed: false, date: '2023-06-20', automated: false },
    { id: 4, title: 'Coordinate with sponsors', completed: false, date: '2023-06-25', automated: true },
    { id: 5, title: 'Draft tweet about Vitalik', completed: false, date: '2023-06-30', automated: true }
  ])
  const [taskClassifications, setTaskClassifications] = useState<TaskClassification[]>([
    {
      category: 'Communication',
      confidence: 0.92,
      suggestedAction: 'Schedule follow-up meeting',
      priority: 'high',
      timeEstimate: '30 mins'
    },
    {
      category: 'Content Creation',
      confidence: 0.88,
      suggestedAction: 'Draft and schedule tweet',
      priority: 'medium',
      timeEstimate: '15 mins'
    }
  ])

  const automationRate = (tasks.filter(task => task.automated).length / tasks.length) * 100

  const classifyInterval = async (startTime: string, endTime: string) => {
    try {
      const searchParams = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
        content_type: 'ocr',
        include_frames: 'true'
      })

      const response = await fetch(`http://localhost:3030/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to fetch data')
      
      const data = await response.json()
      
      const classification = {
        category: 'Meeting',
        confidence: 0.95,
        suggestedAction: 'Create meeting notes',
        priority: 'high' as const,
        timeEstimate: '45 mins'
      }

      setTaskClassifications(prev => [...prev, classification])
    } catch (error) {
      console.error('Error classifying interval:', error)
    }
  }

  function renderOverviewPanel() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>hyprsqrl Value Journey</CardTitle>
            <CardDescription>See how hyprsqrl automates your workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    1. Detect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI monitors your messages and identifies actionable items.
                  </p>
                  <div className="mt-4 p-2 bg-muted rounded-md">
                    <p className="text-sm italic">
                      "Don't forget to tweet about Vitalik's keynote at Unconf!"
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    2. Automate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    hyprsqrl automatically creates tasks and drafts content.
                  </p>
                  <div className="mt-4 space-y-2">
                    <Badge>Task Created</Badge>
                    <p className="text-sm">Draft tweet about Vitalik</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    3. Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Review and approve AI-generated content with one click.
                  </p>
                  <div className="mt-4 p-2 bg-muted rounded-md">
                    <p className="text-sm">
                      🚀 Exciting news! @VitalikButerin will be delivering a keynote at #Unconf2023! Don't miss this opportunity to hear from one of the brightest minds in crypto. Get your tickets now at unconf.crypto 🎟️ #Ethereum #Blockchain
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Intelligence</CardTitle>
            <CardDescription>AI-powered task classification and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="classifications">
              <TabsList className="mb-4">
                <TabsTrigger value="classifications">Classifications</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="classifications">
                <div className="grid gap-4 md:grid-cols-2">
                  {taskClassifications.map((classification, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{classification.category}</CardTitle>
                          <Badge variant={
                            classification.priority === 'high' ? 'destructive' :
                            classification.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {classification.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span>{(classification.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time Estimate:</span>
                            <span>{classification.timeEstimate}</span>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium">Suggested Action:</p>
                            <p className="text-sm text-muted-foreground">{classification.suggestedAction}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="insights">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Based on your recent activity patterns, here are some suggestions to optimize your workflow:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Most productive time for meetings: 10 AM - 12 PM</li>
                    <li>Content creation tasks are completed faster in the afternoon</li>
                    <li>Consider batching similar tasks for better efficiency</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Task Automation Progress</CardTitle>
              <CardDescription>Percentage of tasks automated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted-foreground stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    ></circle>
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${automationRate * 2.51327}, 251.327`}
                      transform="rotate(-90 50 50)"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{Math.round(automationRate)}%</span>
                    <span className="text-sm text-muted-foreground">
                      {tasks.filter(task => task.automated).length} / {tasks.length} tasks
                    </span>
                  </div>
                </div>
                <Progress value={automationRate} className="w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active AI Agents</CardTitle>
              <CardDescription>Currently running automations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span>Tweet Drafter</span>
                  </div>
                  <Badge>Active</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span>Meeting Summarizer</span>
                  </div>
                  <Badge>Active</Badge>
                </li>
              </ul>
              <Button variant="link" className="mt-4 w-full">
                Manage AI Agents <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Connected Apps</CardTitle>
              <CardDescription>Your integrated services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </Badge>
                <Badge variant="secondary">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Slack
                </Badge>
                <Badge variant="secondary">
                  <Zap className="w-4 h-4 mr-1" />
                  Zapier
                </Badge>
              </div>
              <Button variant="outline" className="mt-4 w-full">
                Add More Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Automations</CardTitle>
            <CardDescription>Tasks recently handled by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskManager tasks={tasks.filter(task => task.automated)} setTasks={setTasks} />
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderPanel() {
    switch (activePanel) {
      case 'overview':
        return renderOverviewPanel()
      case 'tasks':
        return <TaskManager tasks={tasks} setTasks={setTasks} />
      case 'integrations':
        return <Integrations />
      case 'notifications':
        return <Notifications />
      case 'aiAgents':
        return <AIAgentStore />
      case 'insights':
        return <AutomationInsights tasks={tasks} />
      default:
        return null
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <DashboardHeader activePanel={activePanel} setActivePanel={setActivePanel} />
      <main className="container mx-auto p-4">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

