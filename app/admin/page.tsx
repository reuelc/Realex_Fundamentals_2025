"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Shield, Loader2, FileText, CheckCircle, XCircle, Download, Edit, Trash2, PlusCircle } from "lucide-react"
import * as pdfjs from "pdfjs-dist"
import type { QuizPart, QuizQuestion } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ADMIN_PASSWORD = "super-secret-admin-password"
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([])
  const [status, setStatus] = useState<"idle" | "parsing" | "success" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [updatedJsonUrl, setUpdatedJsonUrl] = useState<string | null>(null)

  const [quizData, setQuizData] = useState<QuizPart[]>([])
  const [selectedPart, setSelectedPart] = useState<string>("part1")
  const [editingQuestion, setEditingQuestion] = useState<{ partId: string; questionIndex: number; question: QuizQuestion } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const sessionAuth = sessionStorage.getItem("admin-auth")
        if (sessionAuth === "true") {
          setIsAuthenticated(true)
        }
    }
  }, [])

  useEffect(() => {
    if(isAuthenticated) {
        fetch('/quiz-data.json')
            .then(res => res.json())
            .then(data => setQuizData(data))
            .catch(err => console.error("Failed to load quiz data", err))
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-auth", "true")
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setStatus("idle")
      setParsedQuestions([])
      setFeedback("")
      setUpdatedJsonUrl(null)
    }
  }

  const handlePdfParse = async () => {
    if (!file) return
    setStatus("parsing")
    setFeedback("Starting PDF parsing...")

    const reader = new FileReader()
    reader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target?.result as ArrayBuffer)
      try {
        const pdf = await pdfjs.getDocument(typedArray).promise
        let fullText = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
        }
        setFeedback("PDF text extracted. Now parsing questions...")
        parseQuestionsFromText(fullText)
      } catch (e) {
        setStatus("error")
        setFeedback(`Error parsing PDF: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const parseQuestionsFromText = (text: string) => {
    const questionRegex = /(\d+)\.\s(.*?)\s+A\.\s(.*?)\s+B\.\s(.*?)\s+C\.\s(.*?)\s+D\.\s(.*?)\s+Correct Answer:\s*([A-D])/gis;

    const matches = [...text.matchAll(questionRegex)]
    const questions: QuizQuestion[] = matches.map(match => {
      const [_, num, question, optA, optB, optC, optD, correctLetter] = match
      const options = [`A. ${optA.trim()}`, `B. ${optB.trim()}`, `C. ${optC.trim()}`, `D. ${optD.trim()}`]
      const correctOption = options.find(opt => opt.startsWith(correctLetter.trim()))
      return {
        question: question.trim(),
        options: options,
        correct: correctOption || ""
      }
    })

    if (questions.length > 0) {
      setParsedQuestions(questions)
      setFeedback(`Successfully parsed ${questions.length} questions. Ready to add to a quiz part.`)
      setStatus("success")
    } else {
      setFeedback("No questions found matching the expected format. Please ensure the PDF follows the '1. Question... A. ... B. ... Correct Answer: C' format.")
      setStatus("error")
    }
  }

  const handleAddQuestions = () => {
    const newQuizData = JSON.parse(JSON.stringify(quizData));
    const targetPart = newQuizData.find((part: QuizPart) => part.id === selectedPart);

    if (targetPart) {
      targetPart.questions.push(...parsedQuestions);
      setQuizData(newQuizData);
      setFeedback("Questions added. Don't forget to generate and download the updated JSON file.")
      setParsedQuestions([])
      setFile(null)
      setStatus("idle")
    } else {
      setStatus("error")
      setFeedback(`Could not find quiz part '${selectedPart}'`);
    }
  }

  const handleUpdateQuestion = (updatedQuestion: QuizQuestion) => {
    if (!editingQuestion) return;
    const { partId, questionIndex } = editingQuestion;
    const newQuizData = [...quizData];
    const partIndex = newQuizData.findIndex(p => p.id === partId);
    if(partIndex !== -1) {
        newQuizData[partIndex].questions[questionIndex] = updatedQuestion;
        setQuizData(newQuizData);
    }
    setEditingQuestion(null);
  }

  const handleDeleteQuestion = (partId: string, questionIndex: number) => {
    if(window.confirm("Are you sure you want to delete this question?")) {
        const newQuizData = [...quizData];
        const partIndex = newQuizData.findIndex(p => p.id === partId);
        if(partIndex !== -1) {
            newQuizData[partIndex].questions.splice(questionIndex, 1);
            setQuizData(newQuizData);
        }
    }
  }

  const generateDownload = () => {
    const updatedJson = JSON.stringify(quizData, null, 2);
    const blob = new Blob([updatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setUpdatedJsonUrl(url);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold mt-4">Admin Access</CardTitle>
            <CardDescription>Enter the password to manage the quiz content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} className={error ? "border-red-500" : ""}/>
              {error && <p className="text-sm text-red-500">Incorrect password.</p>}
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPartQuestions = quizData.find(p => p.id === selectedPart)?.questions || []

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Dialog open={!!editingQuestion} onOpenChange={(isOpen) => !isOpen && setEditingQuestion(null)}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                </DialogHeader>
                {editingQuestion && <EditQuestionForm question={editingQuestion.question} onSave={handleUpdateQuestion} />}
            </DialogContent>
        </Dialog>

      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
            <Button onClick={generateDownload}>
                <Download className="mr-2 h-4 w-4"/> Generate & Download JSON
            </Button>
            <Button variant="outline" onClick={() => { sessionStorage.removeItem("admin-auth"); setIsAuthenticated(false); }}>Logout</Button>
        </div>
      </header>
      {updatedJsonUrl && (
          <div className="p-4 mb-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-between">
              <div>
                  <h4 className="font-bold text-green-800 dark:text-green-200">File Ready for Download</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      A new `quiz-data.json` file has been generated. Download it and replace the existing file in the `lib/` directory.
                  </p>
              </div>
              <a href={updatedJsonUrl} download="quiz-data.json">
                  <Button><Download className="mr-2 h-4 w-4"/>Download Now</Button>
              </a>
          </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Questions from PDF</CardTitle>
            <CardDescription>Select a PDF file to parse and add questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input type="file" accept=".pdf" onChange={handleFileChange} disabled={status === "parsing"} />
              <Button onClick={handlePdfParse} disabled={!file || status === "parsing"}>
                {status === "parsing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Parse PDF
              </Button>
            </div>
            {status !== "idle" && (
              <div className="flex items-center p-4 rounded-md bg-muted">
                {status === "parsing" && <Loader2 className="h-5 w-5 mr-3 animate-spin text-primary" />}
                {status === "success" && <CheckCircle className="h-5 w-5 mr-3 text-green-500" />}
                {status === "error" && <XCircle className="h-5 w-5 mr-3 text-red-500" />}
                <p className="text-sm">{feedback}</p>
              </div>
            )}
            {parsedQuestions.length > 0 && status === "success" && (
                <div className="space-y-4">
                    <h3 className="font-bold">Parsed Questions ({parsedQuestions.length}):</h3>
                    <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                        <ul className="list-decimal list-inside text-sm">
                            {parsedQuestions.map((q, i) => <li key={i}>{q.question}</li>)}
                        </ul>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={setSelectedPart} defaultValue={selectedPart}>
                            <SelectTrigger><SelectValue placeholder="Select quiz part" /></SelectTrigger>
                            <SelectContent>
                                {quizData.map(part => <SelectItem key={part.id} value={part.id}>{part.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddQuestions}><PlusCircle className="mr-2 h-4 w-4"/>Add to Part</Button>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Edit Questions</CardTitle>
            <Select onValueChange={setSelectedPart} defaultValue={selectedPart}>
                <SelectTrigger><SelectValue placeholder="Select quiz part to edit" /></SelectTrigger>
                <SelectContent>
                    {quizData.map(part => <SelectItem key={part.id} value={part.id}>{part.title}</SelectItem>)}
                </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {currentPartQuestions.map((q, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <p className="text-sm flex-1 pr-4 truncate">{q.question}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setEditingQuestion({ partId: selectedPart, questionIndex: index, question: q })}>
                            <Edit className="h-4 w-4"/>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteQuestion(selectedPart, index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            ))}
            {currentPartQuestions.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No questions in this part.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EditQuestionForm({ question: initialQuestion, onSave }: { question: QuizQuestion; onSave: (updatedQuestion: QuizQuestion) => void; }) {
    const [question, setQuestion] = useState(initialQuestion.question)
    const [options, setOptions] = useState(initialQuestion.options)
    const [correct, setCorrect] = useState(initialQuestion.correct)

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    const handleSave = () => {
        onSave({ question, options, correct })
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="question-text">Question</Label>
                <Textarea id="question-text" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            {options.map((opt, index) => (
                <div key={index} className="grid gap-2">
                    <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                    <Input id={`option-${index}`} value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} />
                </div>
            ))}
            <div className="grid gap-2">
                <Label htmlFor="correct-answer">Correct Answer</Label>
                <Select onValueChange={setCorrect} defaultValue={correct}>
                    <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                    <SelectContent>
                        {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogClose>
            </DialogFooter>
        </div>
    )
}
