"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { QuizQuestion, QuizResult } from "@/lib/types"
import { CheckIcon, XIcon, RefreshCwIcon, HomeIcon, ClockIcon, Award, Frown } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizProps {
  questions: QuizQuestion[]
  title: string
  partId: string
}

export default function Quiz({ questions, title, partId }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRetake, setIsRetake] = useState(false)
  const [incorrectlyAnsweredQuestions, setIncorrectlyAnsweredQuestions] = useState<QuizQuestion[]>([])

  const router = useRouter()

  const activeQuestions = useMemo(() => isRetake ? incorrectlyAnsweredQuestions : questions, [isRetake, incorrectlyAnsweredQuestions, questions])
  const currentQuestion = activeQuestions[currentQuestionIndex]
  const totalQuestions = activeQuestions.length

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" && selectedOption && !showResult) {
        event.preventDefault()
        handleNext()
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [selectedOption, showResult, currentQuestionIndex])

  useEffect(() => {
    if (!showResult) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [showResult])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0")
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return
    setSelectedOption(option)
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = option
    setUserAnswers(newAnswers)

    if (option === currentQuestion.correct) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (!selectedOption) return

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedOption(null)
    } else {
      setShowResult(true)
    }
  }

  const handleRestart = (retakeIncorrect = false) => {
    if (retakeIncorrect) {
      const incorrect = questions.filter((q, i) => userAnswers[i] !== q.correct)
      setIncorrectlyAnsweredQuestions(incorrect)
      setIsRetake(true)
    } else {
      setIncorrectlyAnsweredQuestions([])
      setIsRetake(false)
    }

    setShowResult(false)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setUserAnswers([])
    setScore(0)
    setTimer(0)
  }

  const handleExit = () => router.push("/menu")

  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
  const passingGrade = 75

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-fit">
              {percentage >= passingGrade ? (
                <Award className="h-16 w-16 text-green-500" />
              ) : (
                <Frown className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold mt-4">Quiz Results</CardTitle>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              You scored {score} out of {totalQuestions}
            </p>
            <p className={`text-5xl font-bold ${percentage >= passingGrade ? "text-green-600" : "text-red-600"}`}>
              {percentage.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Time taken: {formatTime(timer)}</p>
          </CardHeader>
          <CardContent>
            {userAnswers.map((answer, index) => {
              const question = questions[index]
              if (answer === question.correct) return null
              return (
                <div key={index} className="p-4 border-t dark:border-gray-700">
                  <p className="font-semibold">{index + 1}. {question.question}</p>
                  <p className="text-sm text-red-600 mt-1">Your answer: {answer || "No answer"}</p>
                  <p className="text-sm text-green-600">Correct answer: {question.correct}</p>
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
            {userAnswers.some((ans, i) => ans !== questions[i].correct) && (
              <Button onClick={() => handleRestart(true)} size="lg">
                <RefreshCwIcon className="mr-2 h-4 w-4" /> Retake Incorrect
              </Button>
            )}
            <Button onClick={() => handleRestart(false)} variant="outline" size="lg">
              <RefreshCwIcon className="mr-2 h-4 w-4" /> Restart Full Test
            </Button>
            <Button onClick={handleExit} variant="secondary" size="lg">
              <HomeIcon className="mr-2 h-4 w-4" /> Exit to Menu
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <header className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold truncate pr-4">{title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-lg font-semibold">
                <ClockIcon className="h-5 w-5 mr-2" />
                {formatTime(timer)}
              </div>
              <Button variant="ghost" size="icon" onClick={handleExit}>
                <XIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="h-2" />
        </header>

        <main className="py-8">
          <Card className="shadow-none border-0">
            <CardContent className="p-0">
              <div className="mb-6">
                <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                <p className="text-xl font-semibold mt-1">{currentQuestion.question}</p>
              </div>

              <div className="space-y-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option
                  const isCorrect = option === currentQuestion.correct
                  const hasSelected = selectedOption !== null

                  return (
                    <div
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        "flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        hasSelected && isCorrect && "bg-green-100 border-green-400 dark:bg-green-900/50 dark:border-green-700",
                        isSelected && !isCorrect && "bg-red-100 border-red-400 dark:bg-red-900/50 dark:border-red-700",
                        hasSelected && !isSelected && !isCorrect && "opacity-50"
                      )}
                    >
                      <div className="flex-1 text-base">{option}</div>
                      {hasSelected && isCorrect && <CheckIcon className="h-6 w-6 text-green-600" />}
                      {isSelected && !isCorrect && <XIcon className="h-6 w-6 text-red-600" />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="sticky bottom-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-4">
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!selectedOption} size="lg">
              {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
