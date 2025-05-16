"use client";
import { withAuth } from "@/components/with-auth";
import { useAuthStore } from "@/lib/stores/auth.store";

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <p>Dashboard</p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Et nesciunt
        doloremque voluptatum amet expedita. Nulla, recusandae natus delectus
        aliquid, repudiandae est blanditiis doloremque deleniti iure architecto
        saepe provident modi earum.
      </p>
      <h1>Welcome {user?.uid}</h1>
      {/* Dashboard content */}
    </div>
  );
}

export default withAuth(DashboardPage);
