
import { db } from "./src/db";
import { user, member, organization } from "./src/db/schema";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

async function seedMembers() {
  console.log("Starting to seed members...");

  // 1. Get the first organization
  const [org] = await db.select().from(organization).limit(1);

  if (!org) {
    console.error("No organization found. Please create an organization first.");
    process.exit(1);
  }

  console.log(`Found organization: ${org.name} (${org.id})`);

  const newUsers = [];

  // 2. Create 10 users
  for (let i = 1; i <= 10; i++) {
    const id = crypto.randomUUID();
    const newUser = {
      id,
      name: `测试用户${i}`,
      email: `testuser${i}@example.com`,
      emailVerified: true,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    newUsers.push(newUser);

    // Insert User
    await db.insert(user).values(newUser).onConflictDoNothing();

    // Insert Member
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: org.id,
      userId: newUser.id,
      role: "member",
      createdAt: new Date(),
    });

    console.log(`Created user: ${newUser.name} and added to organization.`);
  }

  console.log("Successfully added 10 members!");
  process.exit(0);
}

seedMembers().catch((err) => {
  console.error("Error seeding members:", err);
  process.exit(1);
});
