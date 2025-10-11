import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (!profile) {
        navigate('/setup');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Pricing />
    </div>
  );
};

export default Index;
