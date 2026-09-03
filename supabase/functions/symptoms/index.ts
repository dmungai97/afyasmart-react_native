// Supabase Edge Function port of symptomsAnalyze/symptomsClarify from
// functions/index.js. Neither route checks Firebase auth — that matches the
// original design: onboarding lets a guest check symptoms before an account
// exists, identifying itself by a client-generated firebase_uid/guest id
// instead. See requestSymptomsAnalysis/requestSymptomsClarification in
// src/services/symptoms.service.ts for the client side of this.
//
// verify_jwt is OFF (set at deploy time) since no Authorization header is
// sent at all for these routes.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getDoc, setDoc } from "./firestore.ts";

const SYMPTOM_FREE_DAILY_LIMIT = 3;

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// deno-lint-ignore no-explicit-any
function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// deno-lint-ignore no-explicit-any
function isSubscribed(user: Record<string, any> | null): boolean {
  if (!user) return false;
  const raw = user.subscription_expires_at;
  const expiresAt = raw instanceof Date ? raw : raw ? new Date(raw) : null;
  return user.is_subscribed === true && (!expiresAt || expiresAt > new Date());
}

// deno-lint-ignore no-explicit-any
function mockSymptomsResponse(): any {
  return {
    urgency: "High",
    urgency_desc: "Your symptoms may need medical attention. Seek advice from a professional.",
    conditions: [
      { name: "Malaria", likelihood: "High", percent: 80, color: "#EF4444" },
      { name: "Flu (Influenza)", likelihood: "Medium", percent: 45, color: "#F59E0B" },
      { name: "Typhoid", likelihood: "Low", percent: 20, color: "#0B6E6E" },
    ],
    medications: [
      { name: "Paracetamol 500mg", desc: "For fever and pain", icon: "💊" },
      { name: "ORS", desc: "To prevent dehydration", icon: "🧃" },
      { name: "Antimalarial", desc: "Seek doctor's advice first", icon: "💉" },
    ],
    self_care: [
      "Rest and drink plenty of fluids",
      "Take paracetamol for fever",
      "Eat light and healthy meals",
    ],
  };
}

async function handleAnalyze(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const { firebase_uid, symptoms, age, gender, duration, severity, answers } = body;

    if (
      !firebase_uid ||
      typeof firebase_uid !== "string" ||
      !Array.isArray(symptoms) ||
      symptoms.length === 0 ||
      age === undefined ||
      age === null ||
      !gender ||
      !duration ||
      !severity
    ) {
      return json({ status: "error", message: "Missing required fields." }, 422);
    }

    const user = (await getDoc(`users/${firebase_uid}`)) ?? {};
    const subscribed = isSubscribed(user);

    if (!subscribed) {
      const today = new Date().toISOString().slice(0, 10);
      const quotaPath = `symptomChecks/${firebase_uid}_${today}`;
      const quota = await getDoc(quotaPath);
      const checksToday = quota?.count || 0;

      if (checksToday >= SYMPTOM_FREE_DAILY_LIMIT) {
        return json({ status: "error", message: "Daily free check limit reached. Subscribe for unlimited checks." }, 429);
      }

      await setDoc(quotaPath, { count: checksToday + 1, updated_at: new Date() });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json({ status: "success", data: mockSymptomsResponse() });

    const symptomList = symptoms.join(", ");
    let answersText = "";
    if (answers && typeof answers === "object") {
      for (const [qId, ans] of Object.entries(answers)) {
        answersText += `- Question ID ${qId}: Answer: ${ans}\n`;
      }
    }

    const prompt =
      "Analyze the following patient profile and symptom context:\n" +
      `- Symptoms: ${symptomList}\n` +
      `- Age: ${age} years old\n` +
      `- Gender: ${gender}\n` +
      `- Duration: ${duration}\n` +
      `- Severity: ${severity}\n` +
      (answersText ? `- Follow-up Questions:\n${answersText}` : "") +
      "\nBased on this information, provide the top 3 possible medical conditions (with likelihood and probability percentage), self-care instructions, and commonly suggested medications/remedies.";

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1020,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You are a professional medical analysis assistant. Your role is to suggest possible conditions based on symptoms.\n' +
                'You must return a raw JSON response representing the diagnosis.\n\n' +
                'JSON SCHEMA:\n' +
                '{\n' +
                '  "urgency": "High" | "Medium" | "Low",\n' +
                '  "urgency_desc": "Explanation of urgency based on symptoms.",\n' +
                '  "conditions": [\n' +
                '    { "name": "Condition Name", "likelihood": "High" | "Medium" | "Low", "percent": integer_between_0_and_100, "color": "#EF4444" for High | "#F59E0B" for Medium | "#0B6E6E" for Low }\n' +
                '  ],\n' +
                '  "medications": [\n' +
                '    { "name": "Medication Name", "desc": "Short description of what it does", "icon": "💊" | "🧃" | "💉" }\n' +
                '  ],\n' +
                '  "self_care": [\n' +
                '    "Actionable advice line 1",\n' +
                '    "Actionable advice line 2"\n' +
                '  ]\n' +
                '}\n' +
                'IMPORTANT — calibrate to how much detail you actually have: if the ' +
                'symptom description and any follow-up answers are vague, minimal, or ' +
                'just a few words with no specifics (location, sensation, triggers, ' +
                'etc.), you MUST use noticeably lower percent values (all under 40) and ' +
                'make urgency_desc explicitly say the input was too limited for a ' +
                'confident read, encouraging the user to describe their symptoms in ' +
                'more detail. Never present specific-sounding conditions or ' +
                'medications with high confidence when the underlying description is ' +
                'this thin.\n' +
                'Do not include any text, backticks, or wrapping outside the JSON object.',
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error("OpenAI Symptoms check failed", { status: response.status });
        return json({ status: "success", data: mockSymptomsResponse() });
      }

      const data = await response.json();
      const jsonData = JSON.parse(data.choices?.[0]?.message?.content || "null");

      if (!jsonData || !jsonData.conditions) {
        console.warn("OpenAI Symptoms check returned invalid JSON structure");
        return json({ status: "success", data: mockSymptomsResponse() });
      }

      return json({ status: "success", data: jsonData });
    } catch (err) {
      console.error("Symptoms OpenAI request failed", err);
      return json({ status: "success", data: mockSymptomsResponse() });
    }
  } catch (error) {
    console.error("symptomsAnalyze failed", error);
    return json({ status: "success", data: mockSymptomsResponse() });
  }
}

async function handleClarify(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const { firebase_uid, symptom, age, severity, history } = body;

    if (!firebase_uid || typeof firebase_uid !== "string" || !symptom || typeof symptom !== "string") {
      return json({ status: "error", message: "Missing required fields." }, 422);
    }

    const priorQA = Array.isArray(history) ? history.slice(0, 2) : [];

    if (priorQA.length >= 2) {
      return json({ status: "success", data: { done: true } });
    }

    // This endpoint deliberately skips auth (guest onboarding needs it before
    // an account exists), so without a quota anyone could call it directly
    // with an arbitrary uid and run up unbounded OpenAI cost. Cap it like
    // symptomsAnalyze's free-check limit — twice as many calls, since one
    // analysis can involve up to two clarify round-trips.
    const user = (await getDoc(`users/${firebase_uid}`)) ?? {};
    if (!isSubscribed(user)) {
      const today = new Date().toISOString().slice(0, 10);
      const quotaPath = `symptomClarifyChecks/${firebase_uid}_${today}`;
      const quota = await getDoc(quotaPath);
      const checksToday = quota?.count || 0;

      if (checksToday >= SYMPTOM_FREE_DAILY_LIMIT * 2) {
        return json({ status: "success", data: { done: true } });
      }

      await setDoc(quotaPath, { count: checksToday + 1, updated_at: new Date() });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json({ status: "success", data: { done: true } });

    const historyText = priorQA.length
      ? priorQA.map((qa: { question: string; answer: string }, i: number) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join("\n")
      : "(none yet)";

    const prompt =
      "A patient described this symptom during intake:\n" +
      `"${symptom}"\n\n` +
      `Age: ${age ?? "unknown"}, self-reported severity: ${severity ?? "unknown"}\n\n` +
      `Follow-up questions already asked this session:\n${historyText}\n\n` +
      "Decide if ONE more short clarifying question would meaningfully help a doctor " +
      "(e.g. specific location, what makes it better or worse, associated symptoms, how " +
      "long it's lasted). If you already have enough to proceed, stop.";

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 300,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a medical intake assistant narrowing down a symptom description " +
                "before a doctor-style analysis. Return raw JSON only, no other text.\n\n" +
                "JSON SCHEMA:\n" +
                "{\n" +
                '  "done": boolean,\n' +
                '  "question": "short clarifying question, present only if done is false",\n' +
                '  "options": ["3 to 4 short tappable answers, present only if done is false"],\n' +
                "  \"duration\": \"best estimate of how long the symptom has lasted, one of " +
                "'Today', '1-3 days', '4-7 days', 'Longer than a week', or 'Not specified' if " +
                "unclear — always present regardless of done\"\n" +
                "}\n" +
                "Keep questions and options under 6 words each. Never ask about gender — that " +
                "is collected separately.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error("OpenAI symptomsClarify failed", { status: response.status });
        return json({ status: "success", data: { done: true } });
      }

      const data = await response.json();
      const jsonData = JSON.parse(data.choices?.[0]?.message?.content || "null");

      if (!jsonData || typeof jsonData.done !== "boolean") {
        console.warn("OpenAI symptomsClarify returned invalid JSON structure");
        return json({ status: "success", data: { done: true } });
      }

      if (!jsonData.done && (!jsonData.question || !Array.isArray(jsonData.options) || jsonData.options.length === 0)) {
        return json({ status: "success", data: { done: true, duration: jsonData.duration } });
      }

      return json({ status: "success", data: jsonData });
    } catch (err) {
      console.error("symptomsClarify OpenAI request failed", err);
      return json({ status: "success", data: { done: true } });
    }
  } catch (error) {
    console.error("symptomsClarify failed", error);
    return json({ status: "success", data: { done: true } });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const path = new URL(req.url).pathname;

  if (path.endsWith("/analyze")) return await handleAnalyze(req);
  if (path.endsWith("/clarify")) return await handleClarify(req);
  return json({ status: "error", message: "Not found" }, 404);
});
