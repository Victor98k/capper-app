import Signup from "@/components/signup";
import capperLogo from "@/images/Cappers Logga (1).svg";

function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-8 md:pt-12">
      <div className="mb-8">
        <img
          src={capperLogo.src}
          alt="Cappers Logo"
          className="h-16 md:h-20 lg:h-24"
        />
      </div>
      <Signup />
    </div>
  );
}

export default SignUpPage;
