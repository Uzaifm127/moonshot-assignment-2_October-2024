import React from "react";

export interface AuthProps {
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoginVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSignupVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
