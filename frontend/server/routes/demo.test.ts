import { describe, expect, it, vi } from "vitest";
import { handleDemo } from "./demo";

describe("handleDemo", () => {
  it("responds with demo payload", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));

    handleDemo({} as any, { status } as any);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: "Hello from Express server" });
  });
});
