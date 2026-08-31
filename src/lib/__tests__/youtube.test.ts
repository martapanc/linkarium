import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId, isYouTubeUrl } from "../youtube";

describe("extractYouTubeVideoId", () => {
  it("parses watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses short, embed, shorts and live URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects non-video YouTube URLs and other hosts", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/@someChannel")).toBeNull();
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=tooshort")).toBeNull();
    expect(extractYouTubeVideoId("https://vimeo.com/12345678")).toBeNull();
    expect(extractYouTubeVideoId("not a url")).toBeNull();
  });

  it("isYouTubeUrl mirrors the id check", () => {
    expect(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isYouTubeUrl("https://example.com")).toBe(false);
  });
});
