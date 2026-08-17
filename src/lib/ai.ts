/**
 * AI layer. Uses an LLM when OPENAI_API_KEY is set, otherwise deterministic
 * heuristics so the whole product works with zero configuration.
 */

export type RankableRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  prepMinutes: number;
  distanceKm: number;
  orderCount: number;
};

export type Recommendation = {
  restaurantId: string;
  score: number;
  reason: string;
};

export type EtaEstimate = {
  minutes: number;
  reason: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function chat(system: string, user: string): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function heuristicScore(r: RankableRestaurant, history: string[]): number {
  const cuisineBoost = history.includes(r.cuisine) ? 1.5 : 0;
  const popularity = Math.min(r.orderCount, 20) / 20;
  const speed = Math.max(0, 45 - r.prepMinutes) / 45;
  const proximity = Math.max(0, 10 - r.distanceKm) / 10;
  return r.rating / 5 + popularity + speed * 0.6 + proximity * 0.6 + cuisineBoost;
}

function heuristicReason(r: RankableRestaurant, history: string[]): string {
  if (history.includes(r.cuisine)) return `You order ${r.cuisine} often`;
  if (r.rating >= 4.6) return `Top rated (${r.rating.toFixed(1)}★)`;
  if (r.prepMinutes <= 15) return "Fast kitchen, quick delivery";
  if (r.distanceKm <= 2) return "Very close to your address";
  return `Popular ${r.cuisine} nearby`;
}

export async function recommendRestaurants(
  restaurants: RankableRestaurant[],
  cuisineHistory: string[],
  limit = 3,
): Promise<Recommendation[]> {
  const ranked = [...restaurants]
    .map((r) => ({
      restaurantId: r.id,
      score: heuristicScore(r, cuisineHistory),
      reason: heuristicReason(r, cuisineHistory),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const llm = await chat(
    "You rank restaurants for a food delivery app. Reply with JSON only: " +
      '{"picks":[{"id":"...","reason":"short reason under 60 chars"}]}.',
    JSON.stringify({
      cuisineHistory,
      limit,
      restaurants: restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        rating: r.rating,
        prepMinutes: r.prepMinutes,
        distanceKm: r.distanceKm,
        orders: r.orderCount,
      })),
    }),
  );

  if (!llm) return ranked;

  try {
    const parsed = JSON.parse(llm) as { picks?: { id: string; reason: string }[] };
    const picks = (parsed.picks ?? [])
      .filter((p) => restaurants.some((r) => r.id === p.id))
      .slice(0, limit);
    if (picks.length === 0) return ranked;
    return picks.map((p, i) => ({
      restaurantId: p.id,
      score: picks.length - i,
      reason: p.reason,
    }));
  } catch {
    return ranked;
  }
}

export async function estimateEta(input: {
  restaurantName: string;
  prepMinutes: number;
  distanceKm: number;
  itemCount: number;
  activeOrders: number;
}): Promise<EtaEstimate> {
  const queueDelay = Math.min(input.activeOrders * 2, 20);
  const sizeDelay = Math.max(0, input.itemCount - 2) * 1.5;
  const travel = input.distanceKm * 3;
  const minutes = Math.round(input.prepMinutes + queueDelay + sizeDelay + travel);
  const reason =
    `${input.prepMinutes}m prep + ${Math.round(queueDelay)}m kitchen queue ` +
    `(${input.activeOrders} active) + ${Math.round(travel)}m travel (${input.distanceKm}km)`;
  return { minutes, reason };
}

export async function supportReply(
  question: string,
  context: string,
): Promise<string> {
  const llm = await chat(
    "You are a concise support agent for a food delivery app. " +
      "Answer in at most 3 sentences using only the given order context.",
    `Context:\n${context}\n\nQuestion: ${question}`,
  );
  if (llm) return llm.trim();

  const q = question.toLowerCase();
  if (q.includes("where") || q.includes("late") || q.includes("eta")) {
    return `Here is the latest on your orders:\n${context}`;
  }
  if (q.includes("cancel")) {
    return "Orders can be cancelled while they are still PLACED or ACCEPTED — open the order page and use Cancel order.";
  }
  if (q.includes("refund")) {
    return "Refunds are issued to the original payment method within 3-5 business days once an order is marked cancelled.";
  }
  return `I can help with order status, cancellations and refunds. Your current orders:\n${context}`;
}
