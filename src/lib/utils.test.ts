import { expect, test, describe, mock } from "bun:test"

// Mock the dependencies before importing 'cn'
mock.module("clsx", () => {
  return {
    clsx: (...inputs: any[]) => {
      return inputs
        .flat(Infinity)
        .filter(Boolean)
        .map((x) => {
          if (typeof x === "string" || typeof x === "number") return x
          if (typeof x === "object") {
            return Object.entries(x)
              .filter(([_, value]) => Boolean(value))
              .map(([key]) => key)
              .join(" ")
          }
          return ""
        })
        .filter(Boolean)
        .join(" ")
    },
  }
})

mock.module("tailwind-merge", () => {
  return {
    twMerge: (input: string) => {
      const classes = input.split(" ")
      const lastClasses = new Map()

      classes.forEach((c) => {
        const parts = c.split("-")
        if (parts.length > 1) {
          const key = parts[0]
          lastClasses.set(key, c)
        } else {
          lastClasses.set(c, c)
        }
      })

      return Array.from(lastClasses.values()).join(" ")
    },
  }
})

// Now import cn after mocks are set up
import { cn } from "./utils"

describe("cn", () => {
  test("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  test("should handle conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar")
  })

  test("should handle objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz")
  })

  test("should handle arrays", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })

  test("should handle nested arrays", () => {
    expect(cn(["foo", ["bar", "baz"]])).toBe("foo bar baz")
  })

  test("should merge tailwind classes correctly", () => {
    // Note: The mock twMerge used in this test environment merges based on the prefix before the first '-'
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("m-2", "m-4", "m-8")).toBe("m-8")
  })

  test("should ignore null, undefined, and boolean values", () => {
    expect(cn("foo", null, undefined, true, false, "bar")).toBe("foo bar")
  })

  test("should handle complex combinations", () => {
    expect(
      cn("base-class", ["array-class", { "obj-true": true, "obj-false": false }], "another-class")
    ).toBe("base-class array-class obj-true another-class")
  })
})
