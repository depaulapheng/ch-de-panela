import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import photos from "../lib/verified-gift-photos.json";
import { bundledGiftPhoto, giftPhotoLicenseUrl } from "../lib/gift-photo-cache";
import { repairVerifiedGiftImages } from "../prisma/repair-verified-images";

describe("verified catalogue photographs", () => {
  it("covers all 64 reviewed gifts with distinct intact licensed source bytes", () => {
    expect(photos).toHaveLength(64);
    expect(new Set(photos.map(p => p.sha256)).size).toBe(64);
    expect(new Set(photos.map(p => `${p.name}|${p.category}`)).size).toBe(64);
    for (const p of photos) {
      expect(p.imageLicense).toBeTruthy();
      expect(p.imageSourceUrl).toMatch(/^https:\/\//);
      expect(Math.min(p.width, p.height)).toBeGreaterThanOrEqual(300);
      const data = readFileSync(`public${p.path}`);
      expect(data.length).toBe(p.bytes);
      expect(createHash("sha256").update(data).digest("hex")).toBe(p.sha256);
      expect(bundledGiftPhoto(p.imageUrl)).toBe(p.path);
    }
  });

  it("never hides an image later edited by the couple", () => {
    expect(bundledGiftPhoto(null)).toBeNull();
    expect(bundledGiftPhoto("https://example.com/the-couples-new-image.jpg")).toBeNull();
    expect(bundledGiftPhoto(photos[0].imageUrl + "&version=edited")).toBeNull();
  });

  it("links to the applicable license", () => {
    expect(giftPhotoLicenseUrl("CC BY-SA 4.0")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
    expect(giftPhotoLicenseUrl("CC BY 2.0")).toBe("https://creativecommons.org/licenses/by/2.0/");
    expect(giftPhotoLicenseUrl("Public domain")).toBeNull();
  });

  it("repairs only missing/exact wrong sources using compare-and-swap, and is idempotent", async () => {
    const p = photos.find(p => p.replaced && p.previousUrl)!;
    let url: string | null = p.previousUrl;
    const updateMany = vi.fn(async (args: any) => {
      expect(args.where).toEqual({ id: "audited-gift", active: true, imageUrl: url });
      url = args.data.imageUrl;
      return { count: 1 };
    });
    const db = { gift: {
      findMany: vi.fn(async (args: any) => args.where.name === p.name && args.where.category.name === p.category ? [{ id: "audited-gift", imageUrl: url }] : []),
      updateMany
    } };
    await repairVerifiedGiftImages(db as any);
    expect(url).toBe(p.imageUrl);
    expect(updateMany).toHaveBeenCalledTimes(1);
    await repairVerifiedGiftImages(db as any);
    expect(updateMany).toHaveBeenCalledTimes(1);
    url = "https://example.com/admin-edit.jpg";
    await repairVerifiedGiftImages(db as any);
    expect(updateMany).toHaveBeenCalledTimes(1);
    url = null;
    await repairVerifiedGiftImages(db as any);
    expect(updateMany).toHaveBeenCalledTimes(2);
  });
});

