"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import quizParts from "@/lib/quiz-data.json"
import { BookOpen, ArrowRight, LogOut, GraduationCap } from "lucide-react"

export default function MenuPage() {
  const router = useRouter()

  const handleExit = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                REALEX Practice Test
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
            Select a Practice Test
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Choose a section to begin your practice session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizParts.map((part) => (
            <Card
              key={part.id}
              onClick={() => router.push(`/test/${part.id}`)}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800"
            >
              <CardHeader className="flex-row items-center space-x-4 pb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {part.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Test your knowledge with {part.questions.length} questions.
                </CardDescription>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Approx. {Math.round(part.questions.length * 0.75)} mins</span>
                  <div className="flex items-center text-primary font-semibold">
                    Start Test
                    <ArrowRight className="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        © {new Date().getFullYear()} REALEX Practice Test. All rights reserved.
      </footer>
    </div>
  )
}
