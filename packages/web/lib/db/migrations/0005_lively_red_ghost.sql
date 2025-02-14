CREATE TABLE "OCRData" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"frameId" text NOT NULL,
	"appName" text,
	"windowName" text,
	"ocrText" text NOT NULL,
	"tsv_content" vector(1536) NOT NULL,
	"metadata" json,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "OCRData" ADD CONSTRAINT "OCRData_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;