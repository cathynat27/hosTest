import { NextRequest, NextResponse } from "next/server";

interface LeadData {
  fullName: string;
  propertyName: string;
  email: string;
  whatsappNumber: string;
  averageRooms: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json();

    // Validate required fields
    if (!body.fullName || !body.propertyName || !body.email || !body.whatsappNumber || !body.averageRooms) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate WhatsApp number format
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    const cleanPhone = body.whatsappNumber.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { message: "Invalid WhatsApp number format" },
        { status: 400 }
      );
    }

    // Validate average rooms
    const rooms = parseInt(body.averageRooms);
    if (isNaN(rooms) || rooms < 1) {
      return NextResponse.json(
        { message: "Invalid average rooms value" },
        { status: 400 }
      );
    }

    //  In production, save this to your database or send to your backend For now, am just logging it and returning success
    console.log("New lead submission:", {
      ...body,
      timestamp: new Date().toISOString(),
    });

    //Send WhatsApp message to the lead Send and  email notification to your team

    return NextResponse.json(
      {
        status: "success",
        message: "Demo scheduled successfully. We'll contact you soon.",
        leadId: `lead_${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing lead:", error);
    return NextResponse.json(
      { message: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}
