'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';

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

interface Room {
  id: string;
  name: string;
  topic: string;
  creator: {
    id: string;
    username: string;
  };
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id: roomId } = params;
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

    // Listen for when a user answers a question
    socket.on('user-answered', (data) => {
      // Update participants list with new scores
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
      setQuestions((prev) => [...prev, question]);
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
  }, [socket, connected]);

  // Fetch room details
  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch room info
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (!roomResponse.ok) throw new Error('Failed to fetch room details');
      const roomData = await roomResponse.json();
      setRoom(roomData.room);
      
      // Fetch questions for this room
      const questionsResponse = await fetch(`/api/rooms/${roomId}/questions`);
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData.questions);
      
      // Fetch participants
      const participantsResponse = await fetch(`/api/rooms/${roomId}/participants`);
      if (!participantsResponse.ok) throw new Error('Failed to fetch participants');
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData.participants);
      
    } catch (err: any) {
      console.error('Error fetching room data:', err);
      setError(err.message || 'Failed to load quiz room');
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
      
      if (!response.ok) throw new Error('Failed to join the room');
      
      // Participant is now added to the room
    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join the room');
    }
  };

  // Handle answering a question
  const handleAnswer = async (optionIndex: number) => {
    if (isAnswered || !user || !roomId || questions.length === 0) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          questionId: currentQuestion.id,
          selectedOption: optionIndex,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit answer');
      
      const data = await response.json();
      setCorrectOption(data.correctOption);
      setExplanation(data.explanation);
      
      // Emit socket event to update other participants
      submitAnswer({
        roomId,
        userId: user.id,
        questionId: currentQuestion.id,
        answer: optionIndex,
        isCorrect: data.isCorrect,
      });
      
    } catch (err: any) {
      console.error('Error submitting answer:', err);
    }
  };

  // Handle going to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setCorrectOption(null);
      setExplanation(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
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
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-slate-900 text-white">
          <div className="container mx-auto px-4 py-6">
            <Link href="/dashboard" className="text-2xl font-bold">
              Clash of Aspirants
            </Link>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Clash of Aspirants
          </Link>
          <div>
            <span className="text-lg font-medium">{room?.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quiz Section */}
        <div className="lg:col-span-3">
          {questions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  <span className="text-gray-600">Topic: {room?.topic}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
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
                  {questions[currentQuestionIndex]?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedOption === index
                          ? correctOption !== null
                            ? index === correctOption
                              ? 'bg-green-100 border-green-400'
                              : 'bg-red-100 border-red-400'
                            : 'bg-indigo-100 border-indigo-400'
                          : correctOption !== null && index === correctOption
                          ? 'bg-green-100 border-green-400'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-800 mr-3">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                      <p className="text-blue-700">{explanation}</p>
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
                      <h3 className="text-xl font-bold text-green-600 mb-2">Quiz Completed!</h3>
                      <p className="mb-4">You have completed the quiz. Check the leaderboard to see your ranking.</p>
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
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
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
          <div className="bg-white rounded-lg shadow-md p-6">
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
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-gray-50'
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
              <p className="text-gray-500 text-center py-4">No participants yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 