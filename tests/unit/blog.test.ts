import { describe, expect, it } from "vitest";
import { BLOG_POSTS, blogPost } from "@/content/blog";

describe("blog", () => {
  it("has every post in both languages with the same structure", () => {
    expect(new Set(BLOG_POSTS.map((p) => p.slug)).size).toBe(BLOG_POSTS.length);
    for (const { slug } of BLOG_POSTS) {
      const es = blogPost("es", slug);
      const en = blogPost("en", slug);
      expect(es.sections.length, slug).toBeGreaterThanOrEqual(4);
      expect(es.sections.length, slug).toBe(en.sections.length);
      expect(es.title.length, slug).toBeGreaterThan(10);
      expect(en.summary.length, slug).toBeGreaterThan(40);
    }
  });

  it("keeps summaries short enough for search results", () => {
    for (const { slug } of BLOG_POSTS) for (const l of ["es", "en"] as const) expect(blogPost(l, slug).summary.length, `${l}/${slug}`).toBeLessThanOrEqual(220);
  });

  it("does not use long dashes in the copy", () => {
    for (const { slug } of BLOG_POSTS) {
      for (const l of ["es", "en"] as const) {
        const p = blogPost(l, slug);
        const text = [p.title, p.summary, ...p.sections.flatMap((s) => [s.h, ...s.p])].join("\n");
        expect(text, `${l}/${slug}`).not.toMatch(/—/);
      }
    }
  });
});
