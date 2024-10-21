"use client";

import React, { Suspense, useEffect, useState } from "react";
import ApplicationData from "./application-data";
import Signup from "./signup";
import Login from "./login";

const App = () => {
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isSignupVisible, setIsSignupVisible] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setAuthLoading(true);

        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          throw new Error("Not Authenticated");
        }

        setAuthenticated(true);
      } catch (error: any) {
        console.error(error);
        setAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <h2 className="text-3xl font-bold">Loading...</h2>
      </div>
    );
  }

  if (isSignupVisible) {
    return (
      <Signup
        setAuthenticated={setAuthenticated}
        setIsSignupVisible={setIsSignupVisible}
        setIsLoginVisible={setIsLoginVisible}
      />
    );
  } else if (isLoginVisible || !authenticated) {
    return (
      <Login
        setAuthenticated={setAuthenticated}
        setIsSignupVisible={setIsSignupVisible}
        setIsLoginVisible={setIsLoginVisible}
      />
    );
  } else {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ApplicationData
          setAuthenticated={setAuthenticated}
          setIsSignupVisible={setIsSignupVisible}
          setIsLoginVisible={setIsLoginVisible}
        />
      </Suspense>
    );
  }
};

export default App;
