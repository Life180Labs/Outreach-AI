import prisma from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({ 
    where: { id: userId }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <ProfileClient user={user} />
    </div>
  );
}
