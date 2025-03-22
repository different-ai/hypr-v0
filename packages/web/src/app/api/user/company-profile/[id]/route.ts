import { NextRequest, NextResponse } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { companyProfileService } from "../../../../../lib/company-profile-service";
import { userProfileService } from "../../../../../lib/user-profile-service";

// Schema for validating company profile updates
const companyProfileUpdateSchema = z.object({
  businessName: z.string().min(1, "Business name is required").optional(),
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
  isDefault: z.boolean().optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

// correct to do params
// export default async function Page({
//   params,
// }: {
//   params: Promise<{ slug: string }>
// }) {
//   const { slug } = await params
//   return <div>My Post: {slug}</div>
// }

// GET: Get a specific company profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);
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

    const companyProfile = await companyProfileService.getCompanyProfile(
      (await params).id,
      userProfile.id
    );

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    return NextResponse.json({ companyProfile });
  } catch (error) {
    console.error("Error getting company profile:", error);
    return NextResponse.json({ error: "Failed to get company profile" }, { status: 500 });
  }
}

// PUT: Update a specific company profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);
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

    // Check if the company profile exists and belongs to the user
    const existingProfile = await companyProfileService.getCompanyProfile(
      (await params).id,
      userProfile.id
    );

    if (!existingProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Validate the request body
    const body = await req.json();
    const validatedData = companyProfileUpdateSchema.parse(body);

    // Update the company profile
    const updatedProfile = await companyProfileService.updateCompanyProfile(
      (await params).id,
      userProfile.id,
      validatedData
    );

    return NextResponse.json({ companyProfile: updatedProfile });
  } catch (error) {
    console.error("Error updating company profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 });
  }
}

// DELETE: Delete a specific company profile
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);
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

    // Check if the company profile exists and belongs to the user
    const existingProfile = await companyProfileService.getCompanyProfile(
      (await params).id,
      userProfile.id
    );

    if (!existingProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Don't allow deleting the default profile if it's the only one
    if (existingProfile.isDefault) {
      const allProfiles = await companyProfileService.getCompanyProfiles(userProfile.id);
      if (allProfiles.length <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the only company profile" },
          { status: 400 }
        );
      }
    }

    // Delete the company profile
    const success = await companyProfileService.deleteCompanyProfile(
      (await params).id,
      userProfile.id
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete company profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company profile:", error);
    return NextResponse.json({ error: "Failed to delete company profile" }, { status: 500 });
  }
}
