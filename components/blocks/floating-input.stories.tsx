import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FloatingInput } from "./floating-input";

const meta = {
  component: FloatingInput,
  parameters: {
    layout: "centered",
  },
  title: "Blocks/FloatingInput",
} satisfies Meta<typeof FloatingInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: "Tên này sẽ hiển thị trong hồ sơ công khai.",
    id: "story-floating-input",
    label: "Tên đăng nhập",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hata UI",
    description: "Giá trị ban đầu giữ label ở trạng thái floating.",
    id: "story-floating-input-value",
    label: "Tên cửa hàng",
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "hata-ui",
    description: "Slug này đã được sử dụng.",
    id: "story-floating-input-invalid",
    label: "Slug",
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "Không thể sửa",
    description: "Input bị khóa.",
    disabled: true,
    id: "story-floating-input-disabled",
    label: "Tên hiển thị",
  },
};
