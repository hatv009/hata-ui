import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FloatingInput } from "./floating-input";

describe("FloatingInput", () => {
  it("renders the default label and description", () => {
    render(<FloatingInput />);

    expect(screen.getByLabelText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByText("Tên này sẽ hiển thị công khai.")).toBeInTheDocument();
  });

  it("connects a custom label to the input id", () => {
    render(
      <FloatingInput
        id="store-name"
        label="Tên cửa hàng"
        description="Tên này hiển thị trong trang bán hàng."
      />,
    );

    const input = screen.getByLabelText("Tên cửa hàng");

    expect(input).toHaveAttribute("id", "store-name");
    expect(screen.getByText("Tên này hiển thị trong trang bán hàng.")).toBeInTheDocument();
  });

  it("passes native input state props through", () => {
    render(
      <FloatingInput
        aria-invalid
        defaultValue="hata-ui"
        disabled
        id="slug"
        label="Slug"
      />,
    );

    const input = screen.getByLabelText("Slug");

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("hata-ui");
  });

  it("can hide the description", () => {
    render(<FloatingInput description={null} />);

    expect(screen.queryByText("Tên này sẽ hiển thị công khai.")).not.toBeInTheDocument();
  });
});
