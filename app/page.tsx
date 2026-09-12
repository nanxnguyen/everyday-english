import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireChatGPTUser("/");

  return <iframe className="learning-frame" src="/learn/index.html" title="Everyday English — 1.000 từ và cụm giao tiếp" />;
}
