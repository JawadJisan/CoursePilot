// app/api/course/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const YT_KEY = "AIzaSyA6-Y_-vtdlOEjYOj1jbl8VOguiDgKWcEw"
const youtube = google.youtube({ version: "v3", auth: YT_KEY });

// Safely parse various JSON response shapes into an array
async function safeJsonArray(res: Response): Promise<any[]> {
  let json: any;
  try {
    json = await res.json();
  } catch {
    return [];
  }
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.documents)) return json.documents;
  console.warn("safeJsonArray: unexpected shape", json);
  return [];
}

// YouTube search
async function fetchYouTube(query: string) {
  console.log("🔍 YouTube search for:", query);
  if (!YT_KEY) {
    // Fallback link if no API key or exhausted
    return [
      {
        title: "Search on YouTube",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          query
        )}`,
      },
    ];
  }
  try {
    const res = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 5,
    });
    console.log("📺 YouTube status:", res.status);
    return (res.data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      thumbnails: item.snippet.thumbnails,
      publishTime: item.snippet.publishTime,
      url: `https://youtu.be/${item.id.videoId}`,
    }));
  } catch (err: any) {
    console.error("❌ YouTube error:", err.message);
    return [
      {
        title: "Search on YouTube",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          query
        )}`,
      },
    ];
  }
}

// Dev.to search
async function fetchDevTo(query: string) {
  console.log("🔍 Dev.to search for:", query);
  try {
    const res = await fetch(
      `https://dev.to/api/articles?per_page=5&tag=${encodeURIComponent(query)}`
    );
    console.log("📝 Dev.to status:", res.status);
    const articles = await safeJsonArray(res);
    return articles.map((a: any) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.published_at,
      tags: a.tag_list,
    }));
  } catch (err: any) {
    console.error("❌ Dev.to error:", err.message);
    return [];
  }
}

// MDN search
async function fetchMDN(query: string) {
  console.log("🔍 MDN search for:", query);
  try {
    const res = await fetch(
      `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(
        query
      )}&locale=en-US`
    );
    console.log("📄 MDN status:", res.status);
    const docs = await safeJsonArray(res);
    return docs.slice(0, 5).map((d: any) => ({
      title: d.title,
      url: `https://developer.mozilla.org${d.mdn_url || d.slug}`,
      summary: d.summary,
    }));
  } catch (err: any) {
    console.error("❌ MDN error:", err.message);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json(
      { status: "error", message: "`query` parameter is required" },
      { status: 400 }
    );
  }

  // Parallel fetch
  const [videos, blogs, docs] = await Promise.all([
    fetchYouTube(query),
    fetchDevTo(query),
    fetchMDN(query),
  ]);

  console.log("✅ Fetched counts →", {
    videos: videos.length,
    blogs: blogs.length,
    docs: docs.length,
  });

  return NextResponse.json(
    {
      status: "success",
      message: "Resources found",
      data: { videos, blogs, docs },
    },
    { status: 200 }
  );
}
