"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LockIcon, GraduationCapIcon, AlertCircle } from "lucide-react"

// In a real-world application, this should be an environment variable
const CORRECT_PASSWORD = "rea-2025-special-access"

export default function PasswordProtection() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      router.push("/menu")
    } else {
      setError("The password you entered is incorrect. Please try again.")
      setTimeout(() => setError(""), 3000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <GraduationCapIcon className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            REALEX Practice Test
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Real Estate Appraiser Licensure Examination
          </p>
        </div>

        <Card className="shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Welcome</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Enter the password to access the practice tests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-12 text-base font-semibold">
                Access Tests
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-xs text-center text-gray-500 mt-8">
            <p>© {new Date().getFullYear()} REALEX Practice Test. All rights reserved.</p>
            <a href="/admin" className="hover:underline">Admin Login</a>
        </div>
      </div>
    </div>
  )
}
