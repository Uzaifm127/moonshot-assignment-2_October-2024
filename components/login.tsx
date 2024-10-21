import React, { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { AuthProps } from "@/types";

const Login = ({
  setAuthenticated,
  setIsLoginVisible,
  setIsSignupVisible,
}: AuthProps) => {
  const [loading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCredentials((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await fetch("/api/login", {
        body: JSON.stringify(credentials),
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setAuthenticated(true);
      setIsLoginVisible(false);
      setIsSignupVisible(false);
    } catch (error: any) {
      console.error(error);

      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full justify-center items-center">
      <div className="shadow-md p-8 rounded-lg border-2 space-y-6">
        <h2 className="font-bold text-3xl text-center">Login</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            className="px-3 py-1 rounded-md border outline-none w-full"
            type="email"
            onChange={onInputChange}
            placeholder="Email"
            required
            disabled={loading}
          />
          <input
            name="password"
            className="px-3 py-1 rounded-md border outline-none w-full block"
            type="password"
            onChange={onInputChange}
            placeholder="Password"
            required
            disabled={loading}
          />

          <Button
            className="w-full"
            variant="default"
            type="submit"
            disabled={loading}
          >
            Login
          </Button>
        </form>

        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <span
            className={cn(
              "font-medium text-[#444444] cursor-pointer",
              loading && "opacity-50 pointer-events-none"
            )}
            onClick={() => {
              setIsLoginVisible(false);
              setIsSignupVisible(true);
            }}
          >
            Sign up
          </span>
        </p>
      </div>
    </main>
  );
};

export default Login;
