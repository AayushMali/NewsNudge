import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!session ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Welcome to NewsNudge</h1>
          <button
            onClick={() => signIn("google")}
            className="px-6 py-2 mb-4 bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-600"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="px-6 py-2 bg-gray-800 text-white rounded-2xl shadow-lg hover:bg-gray-900"
          >
            Sign in with GitHub
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Hello, {session.user.name}</h1>
          <p className="mb-6">You're signed in as {session.user.email}</p>
          <button
            onClick={() => signOut()}
            className="px-6 py-2 bg-red-500 text-white rounded-2xl shadow-lg hover:bg-red-600"
          >
            Sign out
          </button>
          <div className="mt-10 p-6 bg-white rounded-2xl shadow-md w-full max-w-xl">
            <h2 className="text-xl font-semibold mb-4">NewsNudge Dashboard</h2>
            <p className="text-gray-700">Here will be your single-page app content (fact-check input, results, etc.).</p>
          </div>
        </>
      )}
    </div>
  );
}

// NextAuth config file (/pages/api/auth/[...nextauth].js)
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
};

export default NextAuth(authOptions);
