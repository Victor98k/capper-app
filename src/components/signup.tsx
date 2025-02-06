"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import capperLogo from "@/images/Cappers Logga.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserRegistrationData } from "@/types/user";
import { Loader } from "@/components/ui/loader";

export function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCapper, setIsCapper] = useState<boolean | undefined>(undefined);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    description: string;
  } | null>(null);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const registrationData: UserRegistrationData = {
      username,
      firstName,
      lastName,
      email,
      password,
      isCapper,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setAlert({
          type: "error",
          message: "Server Error",
          description: "Invalid response from server. Please try again later.",
        });
        return;
      }

      if (!response.ok) {
        if (data.errors?.password) {
          setAlert({
            type: "error",
            message: "Invalid Password",
            description: data.errors.password.join(", "),
          });
        } else {
          setAlert({
            type: "error",
            message: "Sign-up failed",
            description: data?.error || `Server error: ${response.status}`,
          });
        }
        return;
      }

      if (!data.userId || !data.firstName) {
        throw new Error("Incomplete user data received");
      }

      localStorage.setItem("userName", data.firstName);
      localStorage.setItem("userLastName", data.lastName);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("username", data.username);

      setAlert({
        type: "success",
        message: "Sign-up successful",
        description: "You have successfully signed up",
      });

      router.push("/home");
    } catch (error) {
      console.error("Network Error:", error);
      setAlert({
        type: "error",
        message: "Connection Error",
        description:
          "Failed to connect to the server. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side with video */}
      <div className="hidden md:block w-1/2 relative">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/capperLoginVid.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Right side with signup form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4 md:p-8">
        <img
          src={capperLogo.src}
          alt="Cappers Logo"
          className="hidden md:block w-48 mb-8"
        />
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 text-center">
          Start earning with{" "}
          <span className="inline-flex items-center">
            <img
              src={capperLogo.src}
              alt="Cappers Logo"
              className="h-8 lg:h-10"
            />
          </span>
        </h1>
        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            <AlertTitle>{alert.message}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">
              Create Your <span className="text-[#4e43ff]">Cappers</span>{" "}
              Account
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Enter your details to sign up for an account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Password must be at least 7 characters long and contain at
                  least one uppercase letter
                </p>
              </div>

              {/* Removed capper option for now. */}
              {/* <div className="space-y-2">
                <Label htmlFor="userType">I am a...</Label>
                <Select
                  onValueChange={(value) => setIsAdmin(value === "true")}
                  required
                >
                  <SelectTrigger id="userType">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Admin</SelectItem>
                    <SelectItem value="false">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the terms and conditions
                </label>
                {/* TODO Add terms and conditions, link to that. */}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader size="sm" /> : "Sign Up"}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              {/* <div className="relative flex justify-center text-xs uppercase ">
                <span className="bg-background px-3 text-muted-foreground">
                  Or sign up with
                </span>
              </div> */}
            </div>
            {/* <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button variant="outline">
                <Facebook className="mr-2 h-4 w-4" /> Facebook
              </Button>
            </div> */}
          </CardContent>
          <CardFooter>
            <Button
              variant="link"
              className="w-full text-sm text-muted-foreground"
              onClick={() => router.push("/login")}
            >
              Already have an account? Log in
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Signup;
