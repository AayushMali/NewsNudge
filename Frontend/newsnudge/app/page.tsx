"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState("");
  const [explanation, setExplanation] = useState("");
  const [answer, setAnswer] = useState(""); // factual answer from LLM

  // Verdict block
  const verdictBlock = verdict && (
    <div
      className={`mt-6 p-5 rounded-2xl text-center text-xl font-semibold shadow-lg animate-fade-in ${
        verdict === "REAL"
          ? "bg-gradient-to-r from-green-100 via-white to-green-50 border border-green-200 text-green-900"
          : verdict === "FAKE"
          ? "bg-gradient-to-r from-red-100 via-white to-red-50 border border-red-200 text-red-900"
          : "bg-gradient-to-r from-yellow-100 via-white to-yellow-50 border border-yellow-200 text-yellow-900"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {verdict === "REAL" && (
          <svg
            className="w-6 h-6 text-green-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {verdict === "FAKE" && (
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        {verdict === "NEUTRAL" && (
          <svg
            className="w-6 h-6 text-yellow-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        )}
        <Image
          src={`/${verdict.charAt(0) + verdict.slice(1).toLowerCase()}.png`}
          alt={`${verdict} Image`}
          width={38}
          height={38}
          className="rounded-full"
        />
        Verdict: {verdict.charAt(0) + verdict.slice(1).toLowerCase()}
      </span>
    </div>
  );

  // Explanation block
  const explanationBlock = explanation && (
    <div className="mt-4 p-4 rounded-xl bg-white/80 border border-gray-200 text-gray-800 text-base shadow-md animate-fade-in">
      <span className="font-semibold">Explanation:</span> {explanation}
    </div>
  );

  // Answer block
  const answerBlock = answer && (
    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-base shadow-inner animate-fade-in">
      <span className="font-semibold">Factual Answer:</span> {answer}
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-br from-blue-200 via-fuchsia-100 to-blue-300 opacity-90" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="w-96 h-96 bg-gradient-to-tr from-blue-400/30 via-pink-300/20 to-purple-300/30 rounded-full blur-3xl absolute -top-32 -left-32 animate-pulse" />
        <div className="w-80 h-80 bg-gradient-to-br from-yellow-200/30 via-green-200/20 to-blue-200/30 rounded-full blur-3xl absolute bottom-0 right-0 animate-pulse" />
      </div>

      {/* If not signed in */}
      {!session ? (
        <>
          <Image
            src="/NewsNudge.png"
            alt="News Logo"
            width={120}
            height={120}
            className="mb-6 rounded-full shadow-2xl border-4 border-white/60"
          />
          <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 drop-shadow-lg tracking-tight">
            NewsNudge
          </h1>
          <p className="mb-8 text-xl text-gray-700 text-center max-w-md font-medium">
            Sign in to analyze news headlines and statements with AI-powered
            insights.
          </p>

          {/* Sign-in buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => signIn("google")}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl shadow-xl hover:scale-105 text-lg font-semibold transition-all duration-200"
            >
              Google Sign-In
            </button>
            <button
              onClick={() => signIn("github")}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 text-lg font-semibold transition-all duration-200"
            >
              GitHub Sign-In
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold m-3 text-gray-700 tracking-tight drop-shadow">
            Hello,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              {session.user?.name}
            </span>
          </h1>
          <p className="mb-6 text-gray-400 text-lg">
            You're signed in as{" "}
            <span className="font-semibold">{session.user?.email}</span>
          </p>
          <button
            onClick={() => signOut()}
            className="px-6 py-2 mb-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all duration-200"
          >
            Sign out
          </button>

          {/* Input box */}
          <div className="mt-2 p-10 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-xl border border-gray-200 glass-card animate-fade-in">
            <h2 className="flex items-center justify-center gap-3 text-4xl font-extrabold mb-8 text-center text-blue-700 tracking-tight">
              <Image
                src="/NewsNudge.png"
                alt="News Logo"
                width={70}
                height={65}
                className="rounded-full shadow-lg"
              />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                NewsNudge
              </span>
            </h2>
            <form
              className="flex flex-col gap-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = (
                  form.elements.namedItem("query") as HTMLInputElement
                ).value;

                setLoading(true);
                setResult("");
                setVerdict("");
                setExplanation("");
                setAnswer("");

                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/answer`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: input }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    if (data.type === "classification") {
                      setVerdict(data.data?.verdict || "");
                      setExplanation(data.data?.explanation || "");
                      console.log("Explanation from backend:", data.data?.explanation); // <-- Add this line
                    } else if (data.type === "answer") {
                      setVerdict(data.data?.verdict || "");
                      setExplanation(data.data?.explanation || "");
                      setAnswer(data.data?.answer || "");
                      console.log("Explanation from backend:", data.data?.explanation); // <-- Add this line
                    } else {
                      setResult("Unknown response type from backend");
                    }
                  } else {
                    setResult(data.error || "No result from backend");
                  }
                } catch (err) {
                  console.error("Error:", err);
                  setResult("Error connecting to backend server");
                }
                setLoading(false);
              }}
            >
              <input
                name="query"
                type="text"
                required
                placeholder="Type your news headline or statement..."
                className="px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg shadow-sm bg-white/70 text-black w-full transition-all"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </form>
            {/* Stylish loading animation below the form */}
            {loading && (
              <div className="mt-6 flex items-center justify-center gap-3 text-gray-600 animate-pulse">
                <span className="animate-spin h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent"></span>
                <span className="font-medium">Analyzing your news...</span>
              </div>
            )}
            {/* Output blocks */}
            {verdictBlock}
            {answerBlock}
            {explanationBlock}
            {result && (
              <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-center text-lg shadow-inner animate-fade-in">
                <span className="font-semibold">Result:</span> {result}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
