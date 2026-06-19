export interface NicheTemplate {
  id: string;
  niche_key: string;
  display_name: string;
  first_message: string;
  system_prompt: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  booking_categories: string[];
}

export interface DemoRequest {
  id: string;
  business_name: string;
  niche_key: string;
  phone_number: string;
  consent_given: boolean;
  call_status: "queued" | "in-progress" | "completed" | "failed";
  transcript: string | null;
  booked_demo: boolean;
  feedback_rating: number | null;
  feedback_comment: string | null;
  created_at: string;
}

export interface DemoFormValues {
  business_name: string;
  niche_key: string;
  phone_number: string;
  consent_given: boolean;
}
