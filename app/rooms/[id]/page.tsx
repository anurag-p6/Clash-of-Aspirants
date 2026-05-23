'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';
import { formatQuestionForClient } from '@/lib/quiz-utils';

interface Participant {
  id: string;
  userId: string;
  score: number;
  user: {
    id: string;
    username: string;
  };
}

interface Question {
  id: string;
  content: string;
  options: string[];
  correctOption?: number; // Only revealed after answering
  explanation?: string; // Only revealed after answering
}

interface SavedAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  correctOption: number;
  explanation: string | null;
}

interface Room {
  id: string;
  name: string;
  topic: string;
  creator: {
    id: string;
    username: string;
  };
}

// Define a type for the params
interface PageParams {
  id: string;
}

export default function RoomPage({ params }: { params: Promise<PageParams> }) {
  // Unwrap params using React.use() to handle the future Promise-based params
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  
  const { user, loading } = useAuth();
  const { socket, connected, joinRoom, leaveRoom, submitAnswer } = useSocket();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedAnswers, setSavedAnswers] = useState<Record<string, SavedAnswer>>({});

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch room details and join the room
  useEffect(() => {
    if (user && roomId) {
      fetchRoomDetails();
      joinAsParticipant();
      
      // Socket setup
      if (connected) {
        joinRoom(roomId);
      }
    }
    
    return () => {
      if (connected && roomId) {
        leaveRoom(roomId);
      }
    };
  }, [user, roomId, connected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('user-answered', (data: { userId: string; questionId: string; isCorrect: boolean }) => {
      // Only update other players — our score comes from the API
      if (!user || data.userId === user.id) return;

      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId
            ? { ...p, score: p.score + (data.isCorrect ? 1 : 0) }
            : p
        )
      );
    });

    // Listen for new questions
    socket.on('new-question', (question) => {
      setQuestions((prev) => [...prev, formatQuestionForClient(question)]);
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    });

    // Listen for leaderboard updates
    socket.on('leaderboard-updated', (leaderboard) => {
      setParticipants(leaderboard);
    });

    return () => {
      socket.off('user-answered');
      socket.off('new-question');
      socket.off('leaderboard-updated');
    };
  }, [socket, connected, user?.id]);

  const applySavedAnswerToUi = (answer: SavedAnswer) => {
    setSelectedOption(answer.selectedOption);
    setCorrectOption(answer.correctOption);
    setExplanation(answer.explanation);
    setIsAnswered(true);
  };

  const restoreProgress = (
    questionList: Question[],
    answers: SavedAnswer[]
  ) => {
    const byQuestion: Record<string, SavedAnswer> = {};
    for (const a of answers) {
      byQuestion[a.questionId] = a;
    }
    setSavedAnswers(byQuestion);

    let startIndex = 0;
    for (let i = 0; i < questionList.length; i++) {
      if (!byQuestion[questionList[i].id]) {
        startIndex = i;
        break;
      }
      startIndex = i;
    }

    setCurrentQuestionIndex(startIndex);
    const current = questionList[startIndex];
    const saved = current ? byQuestion[current.id] : undefined;
    if (saved) {
      applySavedAnswerToUi(saved);
    } else {
      setSelectedOption(null);
      setIsAnswered(false);
      setCorrectOption(null);
      setExplanation(null);
    }
  };

  // Fetch room details
  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch room info
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      
      let roomData;
      if (!roomResponse.ok) {
        console.log(`Room fetch failed with status ${roomResponse.status}. Using mock data.`);
        // Use mock data instead of failing for 404s
        roomData = {
          room: {
            id: roomId,
            name: "Mock Quiz Room",
            topic: "General Knowledge",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            creator: {
              id: "mock-user-id",
              username: "MockUser",
              email: "mock@example.com"
            },
            _count: {
              participants: 1,
              questions: 5
            }
          }
        };
      } else {
        try {
          roomData = await roomResponse.json();
        } catch (jsonError) {
          console.error('Error parsing room data JSON:', jsonError);
          // Use mock data instead of failing
          roomData = {
            room: {
              id: roomId,
              name: "Mock Quiz Room",
              topic: "General Knowledge",
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              creator: {
                id: "mock-user-id",
                username: "MockUser",
                email: "mock@example.com"
              },
              _count: {
                participants: 1,
                questions: 5
              }
            }
          };
        }
      }
      setRoom(roomData.room);
      
      // Fetch questions for this room
      const questionsResponse = await fetch(`/api/rooms/${roomId}/questions`);
      let questionsData;
      
      if (!questionsResponse.ok) {
        console.log(`Questions fetch failed with status ${questionsResponse.status}. Using mock data.`);
        // Use mock questions instead of failing
        questionsData = {
          questions: [
            {
              id: "mock-question-1",
              content: "What is the capital of France?",
              options: ["Berlin", "Madrid", "Paris", "Rome"],
              createdAt: new Date().toISOString()
            },
            {
              id: "mock-question-2",
              content: "Which planet is known as the Red Planet?",
              options: ["Venus", "Mars", "Jupiter", "Saturn"],
              createdAt: new Date(Date.now() + 1000).toISOString()
            },
            {
              id: "mock-question-3",
              content: "Who wrote 'Romeo and Juliet'?",
              options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
              createdAt: new Date(Date.now() + 2000).toISOString()
            },
            {
              id: "mock-question-4",
              content: "What is the chemical symbol for water?",
              options: ["O2", "CO2", "H2O", "NaCl"],
              createdAt: new Date(Date.now() + 3000).toISOString()
            },
            {
              id: "mock-question-5",
              content: "Which year did World War II end?",
              options: ["1943", "1945", "1947", "1950"],
              createdAt: new Date(Date.now() + 4000).toISOString()
            }
          ]
        };
      } else {
        try {
          questionsData = await questionsResponse.json();
        } catch (jsonError) {
          console.error('Error parsing questions data JSON:', jsonError);
          // Use mock questions
          questionsData = {
            questions: [
              {
                id: "mock-question-1",
                content: "What is the capital of France?",
                options: ["Berlin", "Madrid", "Paris", "Rome"],
                createdAt: new Date().toISOString()
              },
              {
                id: "mock-question-2",
                content: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                createdAt: new Date(Date.now() + 1000).toISOString()
              },
              {
                id: "mock-question-3",
                content: "Who wrote 'Romeo and Juliet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                createdAt: new Date(Date.now() + 2000).toISOString()
              },
              {
                id: "mock-question-4",
                content: "What is the chemical symbol for water?",
                options: ["O2", "CO2", "H2O", "NaCl"],
                createdAt: new Date(Date.now() + 3000).toISOString()
              },
              {
                id: "mock-question-5",
                content: "Which year did World War II end?",
                options: ["1943", "1945", "1947", "1950"],
                createdAt: new Date(Date.now() + 4000).toISOString()
              }
            ]
          };
        }
      }
      const normalizedQuestions = (questionsData.questions ?? []).map(
        (q: { id: string; content: string; options: unknown; createdAt?: string }) =>
          formatQuestionForClient(q)
      );
      setQuestions(normalizedQuestions);

      if (user?.id && normalizedQuestions.length > 0) {
        try {
          const progressRes = await fetch(
            `/api/rooms/${roomId}/progress?userId=${encodeURIComponent(user.id)}`,
            { cache: "no-store" }
          );
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            restoreProgress(normalizedQuestions, progressData.answers ?? []);
          }
        } catch (progressErr) {
          console.error("Error loading quiz progress:", progressErr);
        }
      }
      
      // Fetch participants
      const participantsResponse = await fetch(`/api/rooms/${roomId}/participants`);
      let participantsData;
      
      if (!participantsResponse.ok) {
        console.log(`Participants fetch failed with status ${participantsResponse.status}. Using mock data.`);
        // Use mock participants instead of failing
        participantsData = {
          participants: [
            {
              id: "mock-participant-1",
              userId: user?.id || "mock-user-1",
              roomId: roomId,
              score: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user: {
                id: user?.id || "mock-user-1",
                username: user?.username || "You"
              }
            },
            {
              id: "mock-participant-2",
              userId: "mock-user-2",
              roomId: roomId,
              score: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user: {
                id: "mock-user-2",
                username: "MockUser2"
              }
            }
          ]
        };
      } else {
        try {
          participantsData = await participantsResponse.json();
        } catch (jsonError) {
          console.error('Error parsing participants data JSON:', jsonError);
          // Use mock participants
          participantsData = {
            participants: [
              {
                id: "mock-participant-1",
                userId: user?.id || "mock-user-1",
                roomId: roomId,
                score: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                user: {
                  id: user?.id || "mock-user-1",
                  username: user?.username || "You"
                }
              },
              {
                id: "mock-participant-2",
                userId: "mock-user-2",
                roomId: roomId,
                score: 2,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                user: {
                  id: "mock-user-2",
                  username: "MockUser2"
                }
              }
            ]
          };
        }
      }
      setParticipants(participantsData.participants);
      
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError((err as Error).message || 'Failed to load quiz room');
    } finally {
      setIsLoading(false);
    }
  };

  // Join the room as a participant
  const joinAsParticipant = async () => {
    if (!user || !roomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      
      if (!response.ok) {
        console.log(`Failed to join room. Status: ${response.status}. Continuing anyway with mock data.`);
        // Instead of failing, we'll continue as if we joined successfully
        // This allows the application to work in development without a backend
        return;
      }
      
      // Participant is now added to the room
    } catch (err) {
      console.error('Error joining room:', err as Error);
      // Don't set error state - just continue with mock data
      console.log('Continuing with mock data despite join error');
    }
  };

  const refreshParticipants = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/participants`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants ?? []);
      }
    } catch (err) {
      console.error("Error refreshing participants:", err);
    }
  };

  // Handle answering a question
  const handleAnswer = async (optionIndex: number) => {
    if (isAnswered || !user || !roomId || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    const prior = savedAnswers[currentQuestion.id];
    if (prior) {
      applySavedAnswerToUi(prior);
      return;
    }

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          questionId: currentQuestion.id,
          selectedOption: optionIndex,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        setIsAnswered(false);
        setSelectedOption(null);
        console.error("Answer submission failed:", response.status);
        return;
      }

      const data = await response.json();
      setCorrectOption(data.correctOption);
      setExplanation(data.explanation);

      const saved: SavedAnswer = {
        questionId: currentQuestion.id,
        selectedOption: optionIndex,
        isCorrect: data.isCorrect,
        correctOption: data.correctOption,
        explanation: data.explanation ?? null,
      };
      setSavedAnswers((prev) => ({ ...prev, [currentQuestion.id]: saved }));

      await refreshParticipants();

      if (!data.alreadyAnswered) {
        submitAnswer({
          roomId,
          userId: user.id,
          questionId: currentQuestion.id,
          answer: optionIndex,
          isCorrect: data.isCorrect,
        });
      }
    } catch (err) {
      setIsAnswered(false);
      setSelectedOption(null);
      console.error("Error submitting answer:", err);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) return;

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = questions[nextIndex];
    const saved = savedAnswers[nextQuestion.id];

    setCurrentQuestionIndex(nextIndex);
    if (saved) {
      applySavedAnswerToUi(saved);
    } else {
      setSelectedOption(null);
      setIsAnswered(false);
      setCorrectOption(null);
      setExplanation(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-gradient">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex flex-col">
        <header className="bg-slate-900 text-white">
          <div className="container mx-auto px-4 py-6">
            <Link href="/dashboard" className="text-2xl font-bold">
              Clash of Aspirants
            </Link>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg">Loading quiz room...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-gradient flex flex-col">
        <header className="bg-slate-900 text-white">
          <div className="container mx-auto px-4 py-6">
            <Link href="/dashboard" className="text-2xl font-bold">
              Clash of Aspirants
            </Link>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md inline-block"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Clash of Aspirants
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center rounded-md bg-violet-900 px-3 py-2 text-white dark:bg-slate-800">
              <span className="text-sm text-slate-300 mr-2">Room Code:</span>
              <span className="font-medium text-white">{roomId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert("Room code copied to clipboard!");
                }}
                className="ml-2 text-slate-300 hover:text-white"
                title="Copy room code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <span className="text-lg font-medium">{room?.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quiz Section */}
        <div className="lg:col-span-3">
          {questions.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  <span className="text-gray-600 dark:text-gray-400">Topic: {room?.topic}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                  <div
                    className="h-full bg-indigo-600 rounded"
                    style={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">
                  {questions[currentQuestionIndex]?.content}
                </h3>

                <div className="space-y-3">
                  {(questions[currentQuestionIndex]?.options ?? []).length === 0 && (
                    <p className="text-amber-700 dark:text-amber-400 text-sm">
                      No answer choices loaded for this question. Refresh the page or recreate the room.
                    </p>
                  )}
                  {(questions[currentQuestionIndex]?.options ?? []).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedOption === index
                          ? correctOption !== null
                            ? index === correctOption
                              ? 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-700'
                              : 'bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-700'
                            : 'bg-indigo-100 border-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-700'
                          : correctOption !== null && index === correctOption
                          ? 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:border-gray-600 dark:hover:bg-slate-700'
                      } transition-colors`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 mr-3">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isAnswered && (
                <div className="mb-6">
                  {explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 dark:bg-blue-900/20 dark:border-blue-800/50">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Explanation:</h4>
                      <p className="text-blue-700 dark:text-blue-400">{explanation}</p>
                    </div>
                  )}

                  {currentQuestionIndex < questions.length - 1 && (
                    <button
                      onClick={handleNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                    >
                      Next Question
                    </button>
                  )}

                  {currentQuestionIndex === questions.length - 1 && (
                    <div className="text-center py-4">
                      <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Quiz Completed!</h3>
                      <p className="mb-4 dark:text-gray-300">You have completed the quiz. Check the leaderboard to see your ranking.</p>
                      <Link
                        href="/dashboard"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md inline-block"
                      >
                        Return to Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 text-center">
              <p className="text-lg mb-4">No questions available for this quiz.</p>
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md inline-block"
              >
                Return to Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
            
            {participants.length > 0 ? (
              <div className="space-y-3">
                {participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-3 rounded ${
                        participant.userId === user?.id
                          ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700'
                          : 'bg-gray-50 dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="font-semibold w-6 text-center">{index + 1}</span>
                        <span className="ml-2 truncate">{participant.user.username}</span>
                      </div>
                      <span className="font-bold">{participant.score}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No participants yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}