import { NextRequest, NextResponse } from "next/server";

import { getAuth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { companyProfileService } from "../../../../lib/company-profile-service";
import { userProfileService } from "../../../../lib/user-profile-service";

// Schema for validating company profile data
const companyProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  taxRegistration: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  industryType: z.string().optional().nullable(),
  streetAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  brandColor: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  metadata: z.record(z.any()).optional().nullable(),
});
// // export default async function Page({
//   params,
// }: {
//   params: Promise<{ slug: string }>
// }) {
//   const { slug } = await params
//   return <div>My Post: {slug}</div>
// }

// GET: Get all company profiles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate the user
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user email
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get user profile first to ensure it exists
    const userProfile = await userProfileService.getOrCreateProfile(userId, userEmail);
    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const companyProfiles = await companyProfileService.getCompanyProfiles(userProfile.id);
    return NextResponse.json({ companyProfiles });
  } catch (error) {
    console.error("Error getting company profiles:", error);
    return NextResponse.json({ error: "Failed to get company profiles" }, { status: 500 });
  }
}

// POST: Create a new company profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate the user
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user email
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get user profile first to ensure it exists
    const userProfile = await userProfileService.getOrCreateProfile(userId, userEmail);
    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Validate the request body
    const body = await request.json();
    const validatedData = companyProfileSchema.parse(body);

    // Create the company profile
    const companyProfile = await companyProfileService.createCompanyProfile({
      userId: userProfile.id,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ companyProfile }, { status: 201 });
  } catch (error) {
    console.error("Error creating company profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create company profile" }, { status: 500 });
  }
}
