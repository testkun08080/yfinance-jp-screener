import { describe, it, expect } from "vitest";
import { neutralizeFormula } from "./csvDownload";

describe("neutralizeFormula", () => {
  it("数式として解釈される先頭文字に ' を前置する", () => {
    expect(neutralizeFormula('=HYPERLINK("http://x")')).toBe('\'=HYPERLINK("http://x")');
    expect(neutralizeFormula("+cmd")).toBe("'+cmd");
    expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeFormula("\tfoo")).toBe("'\tfoo");
    expect(neutralizeFormula("-2+3+cmd|' /C calc'!A0")).toBe("'-2+3+cmd|' /C calc'!A0");
    expect(neutralizeFormula("-A1")).toBe("'-A1");
  });

  it("通常の値はそのまま返す", () => {
    expect(neutralizeFormula("トヨタ自動車")).toBe("トヨタ自動車");
    expect(neutralizeFormula("-12.5")).toBe("-12.5");
    expect(neutralizeFormula("-.5")).toBe("-.5");
    expect(neutralizeFormula("-")).toBe("-");
    expect(neutralizeFormula("")).toBe("");
  });
});
